import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFallbackMarkerPosition } from "../client/src/lib/nearby";

vi.mock("./db", () => ({
  addWishlistItem: vi.fn(),
  archiveSellerListing: vi.fn(),
  createListing: vi.fn(),
  createListingEnquiry: vi.fn(),
  createWishlistChangeNotifications: vi.fn(),
  getBuyerNotifications: vi.fn(),
  getMarketplaceProfile: vi.fn(),
  getPublishedListing: vi.fn(),
  getSellerListing: vi.fn(),
  getSellerListings: vi.fn(),
  getUserByOpenId: vi.fn(),
  getWishlistItems: vi.fn(),
  markBuyerNotificationsRead: vi.fn(),
  registerPremiumInterest: vi.fn(),
  removeWishlistItem: vi.fn(),
  searchNearbyListings: vi.fn(),
  searchPublishedListings: vi.fn(),
  updateSellerListing: vi.fn(),
  upsertMarketplaceProfile: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { storagePut } from "./storage";

function context(): TrpcContext {
  return {
    user: {
      id: 21,
      openId: "marketplace-user",
      email: "seller@example.com",
      name: "Crafted Men Seller",
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
    vi.mocked(db.upsertMarketplaceProfile).mockResolvedValue({ id: 4, userId: 21, accountType: "buyer", displayName: "Crafted Men Buyer" } as never);
    const caller = appRouter.createCaller(context());

    await caller.marketplace.onboard({ accountType: "buyer", displayName: "Crafted Men Buyer", city: "Lagos" });

    expect(db.upsertMarketplaceProfile).toHaveBeenCalledWith({ userId: 21, accountType: "buyer", displayName: "Crafted Men Buyer", city: "Lagos" });
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

  it("forwards nearby filters to the coordinate-aware listing search", async () => {
    vi.mocked(db.searchNearbyListings).mockResolvedValue([] as never);
    const caller = appRouter.createCaller(context());
    const input = { latitudeE6: 6_524_400, longitudeE6: 3_379_200, radiusKm: 25, category: "services" as const };

    await expect(caller.marketplace.nearbyListings(input)).resolves.toEqual([]);
    expect(db.searchNearbyListings).toHaveBeenCalledWith(input);
  });

  it("lets buyer profiles save an available listing to their wishlist", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "buyer" } as never);
    vi.mocked(db.getPublishedListing).mockResolvedValue({ listing: { id: 31 }, seller: { userId: 88 } } as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.saveWishlist({ listingId: 31 })).resolves.toEqual({ success: true });
    expect(db.addWishlistItem).toHaveBeenCalledWith(21, 31);
  });

  it("rejects listing image URLs that do not come from protected project storage", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.createListing({ title: "Minimal leather messenger", description: "A carefully made leather messenger bag with a durable lined interior and adjustable strap.", category: "clothing", currency: "USD", imageUrls: ["https://untrusted.example/image.jpg"] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createListing).not.toHaveBeenCalled();
  });

  it("stores a valid seller image through protected project storage", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "listing-images/21/cover.png", url: "/manus-storage/listing-images/21/cover.png" });
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.uploadListingImage({ dataUrl: "data:image/png;base64,iVBORw0KGgo=" })).resolves.toEqual({ key: "listing-images/21/cover.png", url: "/manus-storage/listing-images/21/cover.png" });
    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^listing-images\/21\//), expect.any(Buffer), "image/png");
  });

  it("preserves protected image gallery URLs when a seller publishes a listing", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    vi.mocked(db.createListing).mockResolvedValue(43 as never);
    const caller = appRouter.createCaller(context());
    const imageUrls = ["/manus-storage/listing-images/21/front.jpg", "/manus-storage/listing-images/21/detail.jpg"];

    await expect(caller.marketplace.createListing({ title: "Hand-finished travel case", description: "A hand-finished leather travel case with an organized interior and a durable clasp for everyday use.", category: "clothing", currency: "USD", imageUrls })).resolves.toEqual({ id: 43 });
    expect(db.createListing).toHaveBeenCalledWith(expect.objectContaining({ imageUrls }));
  });

  it("keeps fallback nearby-map seller marker positions within visible boundaries", () => {
    expect(getFallbackMarkerPosition({ lat: 40.7128, lng: -74.006 }, 40_712_800, -74_006_000)).toEqual({ left: "50%", top: "50%" });
    expect(getFallbackMarkerPosition({ lat: 40.7128, lng: -74.006 }, 50_000_000, -90_000_000)).toEqual({ left: "8%", top: "10%" });
  });

  it("lets a seller update an owned listing and notifies buyers of a price reduction", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    vi.mocked(db.getSellerListing).mockResolvedValue({ listing: { id: 55, title: "Field jacket", priceCents: 40000, status: "published" } } as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.updateListing({ listingId: 55, title: "Field jacket", description: "A durable field jacket with a quilted lining and a clean, relaxed everyday fit for cooler weather.", category: "clothing", priceCents: 30000, currency: "USD", status: "published" })).resolves.toEqual({ success: true });
    expect(db.updateSellerListing).toHaveBeenCalledWith(expect.objectContaining({ listingId: 55, sellerProfileId: 9, priceCents: 30000 }));
    expect(db.createWishlistChangeNotifications).toHaveBeenCalledWith(expect.objectContaining({ listingId: 55, previousPriceCents: 40000, nextPriceCents: 30000 }));
  });

  it("archives an owned listing and creates an availability-change alert", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "seller" } as never);
    vi.mocked(db.getSellerListing).mockResolvedValue({ listing: { id: 56, title: "Studio portrait session", priceCents: null, status: "published" } } as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.deleteListing({ listingId: 56 })).resolves.toEqual({ success: true });
    expect(db.archiveSellerListing).toHaveBeenCalledWith(9, 56);
    expect(db.createWishlistChangeNotifications).toHaveBeenCalledWith(expect.objectContaining({ listingId: 56, nextStatus: "archived" }));
  });

  it("returns buyer notifications and allows them to be marked as read", async () => {
    vi.mocked(db.getMarketplaceProfile).mockResolvedValue({ id: 9, userId: 21, accountType: "buyer" } as never);
    vi.mocked(db.getBuyerNotifications).mockResolvedValue([] as never);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.notifications()).resolves.toEqual([]);
    await expect(caller.marketplace.markNotificationsRead()).resolves.toEqual({ success: true });
    expect(db.markBuyerNotificationsRead).toHaveBeenCalledWith(21);
  });
});
