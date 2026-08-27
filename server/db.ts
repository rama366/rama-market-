import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, listings, listingEnquiries, marketplaceProfiles, premiumInterest, users } from "../drizzle/schema";
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
}) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  await db.insert(marketplaceProfiles).values({
    ...input,
    businessName: input.businessName || null,
    bio: input.bio || null,
    city: input.city || null,
    phone: input.phone || null,
  }).onDuplicateKeyUpdate({
    set: {
      accountType: input.accountType,
      displayName: input.displayName,
      businessName: input.businessName || null,
      bio: input.bio || null,
      city: input.city || null,
      phone: input.phone || null,
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
  return result[0] ?? null;
}

export async function createListing(input: {
  sellerProfileId: number; title: string; description: string; category: "clothing" | "cars" | "homes" | "electronics" | "services";
  priceCents?: number; currency: string; location?: string; imageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace service is unavailable.");
  const result = await db.insert(listings).values({
    ...input,
    priceCents: input.priceCents ?? null,
    location: input.location || null,
    imageUrl: input.imageUrl || null,
    status: "published",
  });
  return result[0].insertId;
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
