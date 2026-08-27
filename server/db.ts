import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, listingImages, listings, listingEnquiries, marketplaceProfiles, premiumInterest, users, wishlists } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getMarketplaceProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertMarketplaceProfile(input: {
  userId: number;
  accountType: "buyer" | "seller";
  displayName: string;
  businessName?: string;
  bio?: string;
  city?: string;
  phone?: string;
  latitudeE6?: number;
  longitudeE6?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.insert(marketplaceProfiles).values({
    ...input,
    businessName: input.businessName || null,
    bio: input.bio || null,
    city: input.city || null,
    phone: input.phone || null,
    latitudeE6: input.latitudeE6 ?? null,
    longitudeE6: input.longitudeE6 ?? null,
  }).onDuplicateKeyUpdate({
    set: {
      accountType: input.accountType,
      displayName: input.displayName,
      businessName: input.businessName || null,
      bio: input.bio || null,
      city: input.city || null,
      phone: input.phone || null,
      latitudeE6: input.latitudeE6 ?? null,
      longitudeE6: input.longitudeE6 ?? null,
    },
  });
  return getMarketplaceProfile(input.userId);
}

export async function searchPublishedListings(input: { query?: string; category?: "clothing" | "cars" | "homes" | "electronics" | "services" }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(listings.status, "published")];
  if (input.category) conditions.push(eq(listings.category, input.category));
  if (input.query) {
    const needle = `%${input.query}%`;
    conditions.push(or(like(listings.title, needle), like(listings.description, needle), like(listings.location, needle))!);
  }
  return db.select({ listing: listings, seller: marketplaceProfiles }).from(listings)
    .innerJoin(marketplaceProfiles, eq(listings.sellerProfileId, marketplaceProfiles.id))
    .where(and(...conditions))
    .orderBy(desc(listings.publishedAt));
}

export async function getPublishedListing(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ listing: listings, seller: marketplaceProfiles }).from(listings)
    .innerJoin(marketplaceProfiles, eq(listings.sellerProfileId, marketplaceProfiles.id))
    .where(and(eq(listings.id, id), eq(listings.status, "published"))).limit(1);
  const item = result[0];
  if (!item) return null;
  const images = await db.select().from(listingImages).where(eq(listingImages.listingId, id)).orderBy(listingImages.sortOrder);
  return { ...item, images };
}

function calculateDistanceKm(latitudeE6: number, longitudeE6: number, destinationLatitudeE6: number, destinationLongitudeE6: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const originLat = latitudeE6 / 1_000_000;
  const originLng = longitudeE6 / 1_000_000;
  const destinationLat = destinationLatitudeE6 / 1_000_000;
  const destinationLng = destinationLongitudeE6 / 1_000_000;
  const latitudeDelta = radians(destinationLat - originLat);
  const longitudeDelta = radians(destinationLng - originLng);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(originLat)) * Math.cos(radians(destinationLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchNearbyListings(input: {
  latitudeE6: number;
  longitudeE6: number;
  radiusKm: number;
  query?: string;
  category?: "clothing" | "cars" | "homes" | "electronics" | "services";
}) {
  const listingsForSearch = await searchPublishedListings(input);
  return listingsForSearch
    .filter(({ seller }) => seller.latitudeE6 !== null && seller.longitudeE6 !== null)
    .map((item) => ({ ...item, distanceKm: calculateDistanceKm(input.latitudeE6, input.longitudeE6, item.seller.latitudeE6!, item.seller.longitudeE6!) }))
    .filter((item) => item.distanceKm <= input.radiusKm)
    .sort((first, second) => first.distanceKm - second.distanceKm);
}

export async function createListing(input: {
  sellerProfileId: number; title: string; description: string; category: "clothing" | "cars" | "homes" | "electronics" | "services";
  priceCents?: number; currency: string; location?: string; imageUrls?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  const result = await db.insert(listings).values({
    ...input,
    priceCents: input.priceCents ?? null,
    location: input.location || null,
    imageUrl: input.imageUrls?.[0] || null,
    status: "published",
  });
  const listingId = result[0].insertId;
  if (input.imageUrls?.length) {
    await db.insert(listingImages).values(input.imageUrls.map((imageUrl, sortOrder) => ({ listingId, imageUrl, sortOrder })));
  }
  return listingId;
}

export async function createListingEnquiry(input: { listingId: number; buyerUserId: number; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.insert(listingEnquiries).values(input);
}

export async function registerPremiumInterest(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.insert(premiumInterest).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ listing: listings, seller: marketplaceProfiles }).from(wishlists)
    .innerJoin(listings, eq(wishlists.listingId, listings.id))
    .innerJoin(marketplaceProfiles, eq(listings.sellerProfileId, marketplaceProfiles.id))
    .where(and(eq(wishlists.userId, userId), eq(listings.status, "published")))
    .orderBy(desc(wishlists.createdAt));
}

export async function addWishlistItem(userId: number, listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.insert(wishlists).values({ userId, listingId }).onDuplicateKeyUpdate({ set: { listingId } });
}

export async function removeWishlistItem(userId: number, listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId)));
}
