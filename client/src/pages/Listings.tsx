import { MarketplaceAssistant } from "@/components/MarketplaceAssistant";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { NearbyMap } from "@/components/NearbyMap";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { categoryPresentation, formatCategory, formatPrice, MARKETPLACE_CATEGORIES, MarketplaceCategory } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Heart, LocateFixed, Map, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";

function parseCategory(value: string | null): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.includes(value as MarketplaceCategory) ? value as MarketplaceCategory : undefined;
}

type Coordinates = { latitudeE6: number; longitudeE6: number };

function parseSharedCoordinates(params: URLSearchParams): Coordinates | null {
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitudeE6: Math.round(latitude * 1_000_000), longitudeE6: Math.round(longitude * 1_000_000) };
}

export default function Listings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const initial = new URLSearchParams(window.location.search);
  const initialCoordinates = parseSharedCoordinates(initial);
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [category, setCategory] = useState<MarketplaceCategory | undefined>(() => parseCategory(initial.get("category")));
  const [coordinates, setCoordinates] = useState<Coordinates | null>(() => initialCoordinates);
  const [radiusKm, setRadiusKm] = useState(25);
  const [mapOpen, setMapOpen] = useState(() => Boolean(initialCoordinates));
  const [locationError, setLocationError] = useState("");
  const searchInput = useMemo(() => ({ query: query.trim() || undefined, category }), [query, category]);
  const listings = trpc.marketplace.listings.useQuery(searchInput);
  const nearbyInput = useMemo(() => coordinates ? { ...coordinates, radiusKm, ...searchInput } : undefined, [coordinates, radiusKm, searchInput]);
  const nearby = trpc.marketplace.nearbyListings.useQuery(nearbyInput!, { enabled: Boolean(nearbyInput) });
  const profile = trpc.marketplace.profile.useQuery(undefined, { enabled: isAuthenticated });
  const wishlist = trpc.marketplace.wishlist.useQuery(undefined, { enabled: profile.data?.accountType === "buyer" });
  const utils = trpc.useUtils();
  const saveWishlist = trpc.marketplace.saveWishlist.useMutation({ onSuccess: () => utils.marketplace.wishlist.invalidate() });
  const removeWishlist = trpc.marketplace.removeWishlist.useMutation({ onSuccess: () => utils.marketplace.wishlist.invalidate() });
  const savedIds = useMemo(() => new Set(wishlist.data?.map(({ listing }) => listing.id) ?? []), [wishlist.data]);
  const activeListings = coordinates ? nearby.data : listings.data;
  const loading = coordinates ? nearby.isLoading : listings.isLoading;
  const failed = coordinates ? nearby.isError : listings.isError;

  const submit = (event: FormEvent) => { event.preventDefault(); };
  const chooseCategory = (value?: MarketplaceCategory) => setCategory(value);
  const locate = () => {
    if (!navigator.geolocation) { setLocationError("Your browser does not support location discovery."); return; }
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => { setCoordinates({ latitudeE6: Math.round(position.coords.latitude * 1_000_000), longitudeE6: Math.round(position.coords.longitude * 1_000_000) }); setMapOpen(true); },
      () => setLocationError("We could not access your location. Please allow location access and try again."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };
  const toggleSaved = (listingId: number) => {
    if (!isAuthenticated) { window.localStorage.setItem("rama-marketplace-path", "buyer"); startLogin(); return; }
    if (profile.data?.accountType !== "buyer") return;
    if (savedIds.has(listingId)) removeWishlist.mutate({ listingId }); else saveWishlist.mutate({ listingId });
  };

  return <div className="min-h-screen bg-[#f7f6f1] font-['DM_Sans'] text-[#183426]"><MarketplaceHeader />
    <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-3 md:px-10 lg:px-14">
      <div className="rounded-[2rem] bg-[#e4eadb] px-6 py-10 sm:px-10 lg:px-14 lg:py-14"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b85a3f]">Crafted Men directory</p><h1 className="mt-3 max-w-xl font-['Playfair_Display'] text-4xl tracking-[-0.045em] text-[#193d2b] sm:text-5xl">Search broadly. Discover thoughtfully.</h1><p className="mt-3 max-w-[620px] leading-7 text-[#4f6957]">Explore registered seller offers in the places and categories that matter to you.</p>
        <form onSubmit={submit} className="mt-8 flex max-w-3xl items-center gap-2 rounded-[1.2rem] bg-[#fcfbf7] p-2.5 shadow-[0_16px_40px_-24px_rgba(25,61,43,0.35)] sm:rounded-full"><Search className="ml-2 size-5 text-[#789181]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-[#7e8f82] sm:text-base" /><button type="submit" className="flex shrink-0 items-center gap-2 rounded-full bg-[#193d2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285941] active:scale-[0.97]"><span className="hidden sm:inline">Search</span><ArrowRight className="size-4" /></button></form>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><button onClick={() => chooseCategory(undefined)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${!category ? "bg-[#193d2b] text-white" : "border border-[#193d2b]/10 bg-[#fcfbf7] text-[#355540] hover:border-[#193d2b]/30"}`}>Everything</button>{MARKETPLACE_CATEGORIES.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? "bg-[#193d2b] text-white" : "border border-[#193d2b]/10 bg-[#fcfbf7] text-[#355540] hover:border-[#193d2b]/30"}`}>{formatCategory(item)}</button>)}</div><div className="flex items-center gap-2 text-xs font-medium text-[#5d7665]"><SlidersHorizontal className="size-4" /> Registered seller listings</div></div>
      <div className="mt-5 rounded-[1.5rem] border border-[#193d2b]/10 bg-[#fcfbf7] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="flex items-center gap-2 text-sm font-semibold text-[#193d2b]"><LocateFixed className="size-4 text-[#b85a3f]" /> Nearby discovery</p><p className="mt-1 text-xs leading-5 text-[#66806e]">Use your approximate location to see sellers around you, based on each seller’s geocoded marketplace city. Your location is not stored.</p></div><div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">{coordinates && [5, 25, 50, 100].map((distance) => <button key={distance} onClick={() => setRadiusKm(distance)} className={`rounded-full px-3 py-2 text-xs font-semibold ${radiusKm === distance ? "bg-[#193d2b] text-white" : "bg-[#edf0e7] text-[#355540]"}`}>{distance} km</button>)}{coordinates ? <><button onClick={() => setMapOpen(!mapOpen)} className="inline-flex items-center gap-2 rounded-full border border-[#193d2b]/15 px-4 py-2 text-xs font-semibold text-[#193d2b]"><Map className="size-3.5" />{mapOpen ? "Hide map" : "Show map"}</button><button onClick={() => { setCoordinates(null); setMapOpen(false); }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#b85a3f]"><X className="size-3.5" />Clear</button></> : <button onClick={locate} className="inline-flex items-center gap-2 rounded-full bg-[#193d2b] px-4 py-2.5 text-xs font-semibold text-white"><LocateFixed className="size-3.5" />Use my location</button>}</div>{locationError && <p className="mt-2 text-xs text-[#b85a3f] sm:col-span-2">{locationError}</p>}</div>
      {coordinates && mapOpen && <div className="mt-5"><NearbyMap center={{ lat: coordinates.latitudeE6 / 1_000_000, lng: coordinates.longitudeE6 / 1_000_000 }} items={nearby.data ?? []} /></div>}
      <section className="mt-8">{loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-[1.5rem] bg-[#e6e9e0]" />)}</div> : failed ? <div className="rounded-[1.8rem] border border-[#b85a3f]/20 bg-[#fff9f5] px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2ded4] text-[#b85a3f]"><Search className="size-5" /></div><h2 className="mt-5 font-['Playfair_Display'] text-3xl text-[#603326]">The directory needs a moment.</h2><p className="mx-auto mt-3 max-w-md leading-6 text-[#795443]">We could not load marketplace listings just now. Please try again in a moment.</p><button onClick={() => coordinates ? nearby.refetch() : listings.refetch()} className="mt-6 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white">Try again</button></div> : activeListings && activeListings.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activeListings.map((item) => { const { listing, seller } = item; const distanceKm = "distanceKm" in item && typeof item.distanceKm === "number" ? item.distanceKm : undefined; const meta = categoryPresentation[listing.category]; const Icon = meta.icon; const isSaved = savedIds.has(listing.id); return <article key={listing.id} className="group relative overflow-hidden rounded-[1.55rem] border border-[#193d2b]/8 bg-[#fcfbf7] text-left transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-26px_rgba(25,61,43,0.55)]"><button onClick={() => setLocation(`/listings/${listing.id}`)} className="block w-full text-left"><div className={`relative grid aspect-[1.4/1] place-items-center ${meta.tone} overflow-hidden`}>{listing.imageUrl ? <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" /> : <Icon className="size-16 text-[#193d2b]/25" strokeWidth={1} />}<span className="absolute left-4 top-4 rounded-full bg-[#fcfbf7]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#193d2b] backdrop-blur">{meta.label}</span></div><div className="p-5"><div className="flex items-start justify-between gap-4"><h2 className="font-['Playfair_Display'] text-xl leading-6 tracking-[-0.025em] text-[#193d2b]">{listing.title}</h2><ArrowRight className="mt-1 size-4 shrink-0 text-[#b85a3f] transition group-hover:translate-x-1" /></div><p className="mt-2 line-clamp-2 text-sm leading-5 text-[#5d7464]">{listing.description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[#193d2b]/8 pt-4"><div><p className="text-sm font-semibold text-[#193d2b]">{formatPrice(listing.priceCents, listing.currency)}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#698071]"><MapPin className="size-3" />{distanceKm !== undefined ? `${distanceKm.toFixed(1)} km away` : listing.location || "Location on request"}</p></div><span className="max-w-[100px] truncate text-xs font-medium text-[#355540]">{seller.businessName || seller.displayName}</span></div></div></button>{(profile.data?.accountType === "buyer" || !isAuthenticated) && <button onClick={() => toggleSaved(listing.id)} disabled={saveWishlist.isPending || removeWishlist.isPending} aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"} className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full shadow-sm backdrop-blur transition ${isSaved ? "bg-[#b85a3f] text-white" : "bg-[#fcfbf7]/90 text-[#193d2b] hover:text-[#b85a3f]"}`}><Heart className="size-4" fill={isSaved ? "currentColor" : "none"} /></button>}</article>; })}</div> : <div className="rounded-[1.8rem] border border-dashed border-[#193d2b]/18 bg-[#fcfbf7] px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e4eadb] text-[#193d2b]"><Sparkles className="size-5" /></div><h2 className="mt-5 font-['Playfair_Display'] text-3xl text-[#193d2b]">{coordinates ? "No nearby matches just yet." : "Your search is ready for its first match."}</h2><p className="mx-auto mt-3 max-w-md leading-6 text-[#5b7462]">{coordinates ? "Try widening your distance, choosing another category, or checking back as local sellers join." : "There are no active listings for this search yet. Try another category, or join Crafted Men and be the first seller to publish what people need."}</p><button onClick={() => coordinates ? setRadiusKm(100) : setLocation("/onboarding?type=seller")} className="mt-6 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white">{coordinates ? "Show within 100 km" : "Become a seller"}</button></div>}</section>
    </main><MarketplaceAssistant /></div>;
}
