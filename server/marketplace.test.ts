import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createListing: vi.fn(),
  createListingEnquiry: vi.fn(),
  getMarketplaceProfile: vi.fn(),
  getPublishedListing: vi.fn(),
  getUserByOpenId: vi.fn(),
  registerPremiumInterest: vi.fn(),
  searchPublishedListings: vi.fn(),
  upsertMarketplaceProfile: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: {
      id: 21,
      openId: "marketplace-user",
      email: "seller@example.com",
      name: "RAMA Seller",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("marketplace procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when an authenticated account has not created a marketplace profile", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue(null as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.profile()).resolves.toBeNull();
  });

  it("creates a buyer profile against the authenticated user", async () => {
    vi.mocked(db.upsertMarketplaceProfile).mockResolvedValue({ id: 4, userId: 21, accountType: "buyer", displayName: "RAMA Buyer" } as never);
    const caller = appRouter.createCaller(context());

    await caller.marketplace.onboard({ accountType: "buyer", displayName: "RAMA Buyer", city: "Lagos" });

    expect(db.upsertMarketplaceProfile).toHaveBeenCalledWith({ userId: 21, accountType: "buyer", displayName: "RAMA Buyer", city: "Lagos" });
  });

  it("allows a seller profile to publish a validated listing", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    vi.mocked(db.createListing).mockResolvedValue(42 as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.createListing({ title: "Restored oak dining table", description: "A carefully restored dining table with a rich oak grain and six comfortable seats.", category: "homes", currency: "USD", priceCents: 120000, location: "Lagos" })).resolves.toEqual({ id: 42 });
    expect(db.createListing).toHaveBeenCalledWith(expect.objectContaining({ sellerProfileId: 9, category: "homes", title: "Restored oak dining table" }));
  });

  it("does not allow a buyer profile to publish a seller listing", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "buyer" } as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.createListing({ title: "Photography session", description: "A portrait session with careful editing and a relaxed city location of your choice.", category: "services", currency: "USD" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createListing).not.toHaveBeenCalled();
  });
});
