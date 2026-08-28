import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const marketplaceProfiles = mysqlTable("marketplaceProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accountType: mysqlEnum("accountType", ["buyer", "seller"]).notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  businessName: varchar("businessName", { length: 160 }),
  bio: text("bio"),
  city: varchar("city", { length: 120 }),
  latitudeE6: int("latitudeE6"),
  longitudeE6: int("longitudeE6"),
  phone: varchar("phone", { length: 40 }),
  membership: mysqlEnum("membership", ["free", "plus"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerProfileId: int("sellerProfileId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["clothing", "cars", "homes", "electronics", "services"]).notNull(),
  priceCents: int("priceCents"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  location: varchar("location", { length: 160 }),
  imageUrl: text("imageUrl"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export const listingEnquiries = mysqlTable("listingEnquiries", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerUserId: int("buyerUserId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const listingImages = mysqlTable("listingImages", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const premiumInterest = mysqlTable("premiumInterest", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("wishlists_user_listing_unique").on(table.userId, table.listingId),
]);

export const buyerNotifications = mysqlTable("buyerNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  type: mysqlEnum("type", ["price_drop", "status_change"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MarketplaceProfile = typeof marketplaceProfiles.$inferSelect;
export type Listing = typeof listings.$inferSelect;
