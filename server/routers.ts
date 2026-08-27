import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { COOKIE_NAME } from "../shared/const";

const categorySchema = z.enum(["clothing", "cars", "homes", "electronics", "services"]);
const profileInput = z.object({
  accountType: z.enum(["buyer", "seller"]),
  displayName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
});

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
    onboard: protectedProcedure.input(profileInput).mutation(({ ctx, input }) => db.upsertMarketplaceProfile({ userId: ctx.user.id, ...input })),
    listings: publicProcedure.input(z.object({ query: z.string().trim().max(120).optional(), category: categorySchema.optional() }).optional()).query(({ input }) => db.searchPublishedListings(input ?? {})),
    listing: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPublishedListing(input.id)),
    createListing: protectedProcedure.input(z.object({
      title: z.string().trim().min(3).max(180),
      description: z.string().trim().min(20).max(5000),
      category: categorySchema,
      priceCents: z.number().int().positive().max(999999999).optional(),
      currency: z.string().trim().length(3).default("USD"),
      location: z.string().trim().max(160).optional(),
      imageUrl: z.string().url().max(2000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.getMarketplaceProfile(ctx.user.id);
      if (!profile || profile.accountType !== "seller") throw new TRPCError({ code: "FORBIDDEN", message: "Create a seller profile before publishing a listing." });
      const id = await db.createListing({ sellerProfileId: profile.id, ...input });
      return { id };
    }),
    enquire: protectedProcedure.input(z.object({ listingId: z.number().int().positive(), message: z.string().trim().min(5).max(1500) })).mutation(async ({ ctx, input }) => {
      const listing = await db.getPublishedListing(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "This listing is no longer available." });
      if (listing.seller.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot contact your own listing." });
      await db.createListingEnquiry({ buyerUserId: ctx.user.id, ...input });
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
          { role: "system", content: "You are RAMA Guide, a concise, warm marketplace assistant. Help people navigate product and service categories, suggest simple search terms, explain how to buy or sell safely on RAMA, and point sellers to create an account. Do not invent listings, availability, prices, policies, payment capability, or contact details. Use short, useful answers in plain language." },
          { role: "user", content: input.message },
        ],
      });
      const content = response.choices[0]?.message?.content;
      return { message: typeof content === "string" ? content : "I can help you explore RAMA or prepare to sell. What are you looking for?" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
