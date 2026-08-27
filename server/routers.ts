import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { GeocodingResult, makeRequest } from "./_core/map";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

const categorySchema = z.enum(["clothing", "cars", "homes", "electronics", "services"]);
const profileInput = z.object({
  accountType: z.enum(["buyer", "seller"]),
  displayName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
});
const nearbyInput = z.object({
  latitudeE6: z.number().int().min(-90_000_000).max(90_000_000),
  longitudeE6: z.number().int().min(-180_000_000).max(180_000_000),
  radiusKm: z.number().int().min(1).max(200),
  query: z.string().trim().max(120).optional(),
  category: categorySchema.optional(),
});

async function coordinatesForCity(city?: string) {
  if (!city) return {};
  try {
    const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address: city });
    const location = result.results[0]?.geometry.location;
    if (!location) return {};
    return { latitudeE6: Math.round(location.lat * 1_000_000), longitudeE6: Math.round(location.lng * 1_000_000) };
  } catch (error) {
    console.warn("[Marketplace] Could not geocode seller city", error);
    return {};
  }
}

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Please upload a PNG, JPEG, or WebP image." });
  const image = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!image.length || image.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Images must be smaller than 8 MB." });
  const mimeType = match[1];
  const validSignature = (mimeType === "image/jpeg" && image[0] === 0xff && image[1] === 0xd8) || (mimeType === "image/png" && image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) || (mimeType === "image/webp" && image.subarray(0, 4).toString() === "RIFF" && image.subarray(8, 12).toString() === "WEBP");
  if (!validSignature) throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file does not match its image format." });
  return { image, mimeType, extension: mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp" };
}

async function buyerProfile(userId: number) {
  const profile = await db.getMarketplaceProfile(userId);
  if (!profile || profile.accountType !== "buyer") throw new TRPCError({ code: "FORBIDDEN", message: "Create a buyer profile to save listings." });
  return profile;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    profile: protectedProcedure.query(({ ctx }) => db.getMarketplaceProfile(ctx.user.id)),
    onboard: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
      const coordinates = input.accountType === "seller" ? await coordinatesForCity(input.city) : {};
      return db.upsertMarketplaceProfile({ userId: ctx.user.id, ...input, ...coordinates });
    }),
    listings: publicProcedure.input(z.object({ query: z.string().trim().max(120).optional(), category: categorySchema.optional() }).optional()).query(({ input }) => db.searchPublishedListings(input ?? {})),
    nearbyListings: publicProcedure.input(nearbyInput).query(({ input }) => db.searchNearbyListings(input)),
    listing: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPublishedListing(input.id)),
    createListing: protectedProcedure.input(z.object({
      title: z.string().trim().min(3).max(180),
      description: z.string().trim().min(20).max(5000),
      category: categorySchema,
      priceCents: z.number().int().positive().max(999999999).optional(),
      currency: z.string().trim().length(3).default("USD"),
      location: z.string().trim().max(160).optional(),
      imageUrls: z.array(z.string().max(2000).refine((url) => url.startsWith("/manus-storage/"), "Listing images must use project storage.")).max(6).optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.getMarketplaceProfile(ctx.user.id);
      if (!profile || profile.accountType !== "seller") throw new TRPCError({ code: "FORBIDDEN", message: "Create a seller profile before publishing a listing." });
      const id = await db.createListing({ sellerProfileId: profile.id, ...input });
      return { id };
    }),
    uploadListingImage: protectedProcedure.input(z.object({ dataUrl: z.string().min(32).max(12_000_000) })).mutation(async ({ ctx, input }) => {
      const profile = await db.getMarketplaceProfile(ctx.user.id);
      if (!profile || profile.accountType !== "seller") throw new TRPCError({ code: "FORBIDDEN", message: "Create a seller profile before uploading listing images." });
      const { image, mimeType, extension } = parseImageDataUrl(input.dataUrl);
      return storagePut(`listing-images/${ctx.user.id}/${crypto.randomUUID()}.${extension}`, image, mimeType);
    }),
    enquire: protectedProcedure.input(z.object({ listingId: z.number().int().positive(), message: z.string().trim().min(5).max(1500) })).mutation(async ({ ctx, input }) => {
      const listing = await db.getPublishedListing(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "This listing is no longer available." });
      if (listing.seller.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot contact your own listing." });
      await db.createListingEnquiry({ buyerUserId: ctx.user.id, ...input });
      return { success: true };
    }),
    wishlist: protectedProcedure.query(async ({ ctx }) => {
      await buyerProfile(ctx.user.id);
      return db.getWishlistItems(ctx.user.id);
    }),
    saveWishlist: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await buyerProfile(ctx.user.id);
      const listing = await db.getPublishedListing(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "This listing is no longer available." });
      await db.addWishlistItem(ctx.user.id, input.listingId);
      return { success: true };
    }),
    removeWishlist: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await buyerProfile(ctx.user.id);
      await db.removeWishlistItem(ctx.user.id, input.listingId);
      return { success: true };
    }),
    premiumInterest: protectedProcedure.mutation(async ({ ctx }) => {
      await db.registerPremiumInterest(ctx.user.id);
      return { success: true };
    }),
  }),
  ai: router({
    help: publicProcedure.input(z.object({ message: z.string().trim().min(2).max(1000) })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "You are Crafted Men Guide, a concise, warm marketplace assistant. Help people navigate product and service categories, suggest simple search terms, explain how to buy or sell safely on Crafted Men, and point sellers to create an account. Do not invent listings, availability, prices, policies, payment capability, or contact details. Use short, useful answers in plain language." },
          { role: "user", content: input.message },
        ],
      });
      const content = response.choices[0]?.message?.content;
      return { message: typeof content === "string" ? content : "I can help you explore Crafted Men or prepare to sell. What are you looking for?" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
