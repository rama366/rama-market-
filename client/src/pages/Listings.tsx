import { MarketplaceAssistant } from "@/components/MarketplaceAssistant";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { categoryPresentation, formatCategory, formatPrice, MARKETPLACE_CATEGORIES, MarketplaceCategory } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { ArrowRight, MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";

function parseCategory(value: string | null): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.includes(value as MarketplaceCategory) ? value as MarketplaceCategory : undefined;
}

export default function Listings() {
  const [, setLocation] = useLocation();
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [category, setCategory] = useState<MarketplaceCategory | undefined>(() => parseCategory(initial.get("category")));
  const searchInput = useMemo(() => ({ query: query.trim() || undefined, category }), [query, category]);
  const listings = trpc.marketplace.listings.useQuery(searchInput);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    setLocation(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };
  const chooseCategory = (value?: MarketplaceCategory) => {
    setCategory(value);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (value) params.set("category", value);
    setLocation(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return <div className="min-h-screen bg-[#f7f6f1] font-['DM_Sans'] text-[#183426]"><MarketplaceHeader />
    <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-3 md:px-10 lg:px-14">
      <div className="rounded-[2rem] bg-[#e4eadb] px-6 py-10 sm:px-10 lg:px-14 lg:py-14"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b85a3f]">Marketplace directory</p><h1 className="mt-3 max-w-xl font-['Playfair_Display'] text-4xl tracking-[-0.045em] text-[#193d2b] sm:text-5xl">Search broadly. Discover thoughtfully.</h1><p className="mt-3 max-w-[620px] leading-7 text-[#4f6957]">Explore registered seller offers in the places and categories that matter to you.</p>
        <form onSubmit={submit} className="mt-8 flex max-w-3xl items-center gap-2 rounded-[1.2rem] bg-[#fcfbf7] p-2.5 shadow-[0_16px_40px_-24px_rgba(25,61,43,0.35)] sm:rounded-full"><Search className="ml-2 size-5 text-[#789181]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-[#7e8f82] sm:text-base" /><button type="submit" className="flex shrink-0 items-center gap-2 rounded-full bg-[#193d2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285941] active:scale-[0.97]"><span className="hidden sm:inline">Search</span><ArrowRight className="size-4" /></button></form>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><button onClick={() => chooseCategory(undefined)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${!category ? "bg-[#193d2b] text-white" : "border border-[#193d2b]/10 bg-[#fcfbf7] text-[#355540] hover:border-[#193d2b]/30"}`}>Everything</button>{MARKETPLACE_CATEGORIES.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? "bg-[#193d2b] text-white" : "border border-[#193d2b]/10 bg-[#fcfbf7] text-[#355540] hover:border-[#193d2b]/30"}`}>{formatCategory(item)}</button>)}</div><div className="flex items-center gap-2 text-xs font-medium text-[#5d7665]"><SlidersHorizontal className="size-4" /> Registered seller listings</div></div>
      <section className="mt-9">{listings.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-[1.5rem] bg-[#e6e9e0]" />)}</div> : listings.isError ? <div className="rounded-[1.8rem] border border-[#b85a3f]/20 bg-[#fff9f5] px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2ded4] text-[#b85a3f]"><Search className="size-5" /></div><h2 className="mt-5 font-['Playfair_Display'] text-3xl text-[#603326]">The directory needs a moment.</h2><p className="mx-auto mt-3 max-w-md leading-6 text-[#795443]">We could not load marketplace listings just now. Please try again in a moment.</p><button onClick={() => listings.refetch()} className="mt-6 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white">Try again</button></div> : listings.data && listings.data.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.data.map(({ listing, seller }) => { const meta = categoryPresentation[listing.category]; const Icon = meta.icon; return <button onClick={() => setLocation(`/listings/${listing.id}`)} key={listing.id} className="group overflow-hidden rounded-[1.55rem] border border-[#193d2b]/8 bg-[#fcfbf7] text-left transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-26px_rgba(25,61,43,0.55)]"><div className={`relative grid aspect-[1.4/1] place-items-center ${meta.tone} overflow-hidden`}>{listing.imageUrl ? <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" /> : <Icon className="size-16 text-[#193d2b]/25" strokeWidth={1} />}<span className="absolute left-4 top-4 rounded-full bg-[#fcfbf7]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#193d2b] backdrop-blur">{meta.label}</span></div><div className="p-5"><div className="flex items-start justify-between gap-4"><h2 className="font-['Playfair_Display'] text-xl leading-6 tracking-[-0.025em] text-[#193d2b]">{listing.title}</h2><ArrowRight className="mt-1 size-4 shrink-0 text-[#b85a3f] transition group-hover:translate-x-1" /></div><p className="mt-2 line-clamp-2 text-sm leading-5 text-[#5d7464]">{listing.description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[#193d2b]/8 pt-4"><div><p className="text-sm font-semibold text-[#193d2b]">{formatPrice(listing.priceCents, listing.currency)}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#698071]"><MapPin className="size-3" />{listing.location || "Location on request"}</p></div><span className="max-w-[100px] truncate text-xs font-medium text-[#355540]">{seller.businessName || seller.displayName}</span></div></div></button>; })}</div> : <div className="rounded-[1.8rem] border border-dashed border-[#193d2b]/18 bg-[#fcfbf7] px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e4eadb] text-[#193d2b]"><Sparkles className="size-5" /></div><h2 className="mt-5 font-['Playfair_Display'] text-3xl text-[#193d2b]">Your search is ready for its first match.</h2><p className="mx-auto mt-3 max-w-md leading-6 text-[#5b7462]">There are no active listings for this search yet. Try another category, or join RAMA and be the first seller to publish what people need.</p><button onClick={() => setLocation("/onboarding?type=seller")} className="mt-6 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white">Become a seller</button></div>}</section>
    </main><MarketplaceAssistant /></div>;
}
