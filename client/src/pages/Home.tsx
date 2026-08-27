import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  ChevronRight,
  Gem,
  Heart,
  House,
  Laptop,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Store,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

const categories = [
  { name: "Clothing", hint: "Independent labels & essentials", icon: Shirt, tone: "bg-[#eee8dd]" },
  { name: "Cars", hint: "Vehicles & transport", icon: CarFront, tone: "bg-[#dce8e1]" },
  { name: "Homes", hint: "Spaces made for living", icon: House, tone: "bg-[#e8e4ef]" },
  { name: "Electronics", hint: "Tools for modern life", icon: Laptop, tone: "bg-[#e1e9ed]" },
  { name: "Services", hint: "Local expertise, on demand", icon: Wrench, tone: "bg-[#f0e3db]" },
] as const;

const discoveryLinks = ["Near you", "New this week", "Verified sellers", "Premium picks"];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const journey = window.localStorage.getItem("rama-marketplace-path");
    if (isAuthenticated && (journey === "buyer" || journey === "seller")) {
      setLocation(`/onboarding?type=${journey}`);
    }
  }, [isAuthenticated, setLocation]);

  const storeJourney = (type: "buyer" | "seller") => {
    if (isAuthenticated) {
      setLocation(`/onboarding?type=${type}`);
      return;
    }
    window.localStorage.setItem("rama-marketplace-path", type);
    startLogin();
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    setLocation(normalizedQuery ? `/listings?q=${encodeURIComponent(normalizedQuery)}` : "/listings");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f6f1] font-['DM_Sans'] text-[#183426] selection:bg-[#c8d0a8] selection:text-[#183426]">
      <div className="border-b border-[#183426]/10 bg-[#193d2b] px-4 py-2.5 text-center text-[10px] font-medium tracking-[0.14em] text-[#f9f7f0] sm:text-xs">
        A more considered way to find, sell, and connect.
      </div>

      <header className="relative z-30 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10 lg:px-14">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5 text-left" aria-label="Crafted Men home">
          <span className="grid size-9 place-items-center rounded-full bg-[#193d2b] text-sm font-bold text-[#f8f7f1]">C</span>
          <span className="text-lg font-semibold tracking-[-0.07em] text-[#193d2b]">CRAFTED MEN</span>
          <span className="hidden border-l border-[#193d2b]/20 pl-2 text-[9px] font-medium tracking-[0.16em] text-[#193d2b]/70 sm:inline">MARKETPLACE</span>
        </button>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[#31513f] lg:flex">
          <button onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })} className="transition-colors hover:text-[#b85a3f]">Browse</button>
          <button onClick={() => setLocation("/listings") } className="transition-colors hover:text-[#b85a3f]">Find listings</button>
          <button onClick={() => document.getElementById("premium")?.scrollIntoView({ behavior: "smooth" })} className="transition-colors hover:text-[#b85a3f]">Crafted+</button>
          <button onClick={() => storeJourney("seller")} className="transition-colors hover:text-[#b85a3f]">For sellers</button>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <button onClick={() => storeJourney("buyer")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#193d2b] transition-colors hover:bg-[#193d2b]/5">Sign in</button>
          <button onClick={() => storeJourney("seller")} className="rounded-full bg-[#193d2b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-13px_rgba(25,61,43,0.8)] transition hover:-translate-y-0.5 hover:bg-[#285941] active:scale-[0.97]">Start selling</button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-[#193d2b]/15 text-[#193d2b] sm:hidden" aria-label="Open navigation">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {menuOpen && (
          <div className="absolute left-5 right-5 top-[72px] rounded-[1.5rem] border border-[#193d2b]/10 bg-[#fcfbf7] p-4 shadow-xl sm:hidden">
            {[
              ["Browse categories", () => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })],
              ["Find listings", () => setLocation("/listings")],
              ["Crafted+", () => document.getElementById("premium")?.scrollIntoView({ behavior: "smooth" })],
              ["Start selling", () => storeJourney("seller")],
            ].map(([label, action]) => (
              <button key={label as string} onClick={() => { setMenuOpen(false); (action as () => void)(); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#193d2b] hover:bg-[#edf0e7]">
                {label as string}<ChevronRight className="size-4" />
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-[1440px] px-5 pb-14 pt-3 md:px-10 md:pb-20 lg:px-14">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#dfe4d4] px-6 pb-10 pt-12 sm:rounded-[2.75rem] sm:px-10 sm:pt-16 lg:min-h-[600px] lg:px-16 lg:pt-24">
            <div className="relative z-10 max-w-[660px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#193d2b]/15 bg-[#f9f8f2]/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#355540] backdrop-blur">
                <Sparkles className="size-3.5 text-[#b85a3f]" /> One place. Every possibility.
              </div>
              <h1 className="max-w-[630px] font-['Playfair_Display'] text-5xl leading-[0.96] tracking-[-0.055em] text-[#193d2b] sm:text-6xl lg:text-7xl">
                Find what moves <em className="font-normal text-[#b85a3f]">your world.</em>
              </h1>
              <p className="mt-6 max-w-[510px] text-base leading-7 text-[#355540] sm:text-lg">
                Crafted Men brings together remarkable products, places, and people—so whatever you are looking for, your next connection starts here.
              </p>

              <form onSubmit={submitSearch} className="mt-9 max-w-[620px] rounded-[1.2rem] bg-[#fcfbf7] p-2 shadow-[0_22px_60px_-30px_rgba(25,61,43,0.45)] sm:rounded-full sm:p-2.5">
                <div className="flex items-center gap-2">
                  <Search className="ml-2 size-5 shrink-0 text-[#779080]" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for anything—cars, homes, services..." className="h-12 min-w-0 flex-1 bg-transparent px-1 text-sm text-[#193d2b] outline-none placeholder:text-[#7e8f82] sm:text-base" aria-label="Search Crafted Men" />
                  <button type="submit" className="hidden items-center gap-2 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285941] active:scale-[0.97] sm:inline-flex">Search <ArrowRight className="size-4" /></button>
                  <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#193d2b] text-white sm:hidden" aria-label="Submit search"><ArrowRight className="size-4" /></button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#4b6655]">
                <span className="mr-1 font-medium">Explore:</span>
                {discoveryLinks.map((link) => <button key={link} onClick={() => setLocation(`/listings?filter=${encodeURIComponent(link.toLowerCase())}`)} className="rounded-full border border-[#193d2b]/10 bg-[#f8f7f0]/65 px-3 py-1.5 transition hover:border-[#193d2b]/30 hover:bg-white">{link}</button>)}
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-full overflow-hidden lg:w-[62%]">
              <div className="absolute inset-0 bg-[#dfe4d4]/65 lg:bg-gradient-to-r lg:from-[#dfe4d4] lg:via-[#dfe4d4]/45 lg:to-transparent" />
              <img src="/manus-storage/rama-marketplace-hero_ca0a749b.jpg" alt="A curated collection representing fashion, vehicles, homes and technology" className="h-full w-full object-cover object-[66%_center] mix-blend-multiply opacity-90" />
            </div>
            <div className="absolute bottom-7 right-7 z-10 hidden items-center gap-3 rounded-2xl bg-[#fcfbf7]/90 p-3.5 shadow-lg backdrop-blur md:flex">
              <div className="grid size-9 place-items-center rounded-xl bg-[#efdcd3] text-[#b85a3f]"><Heart className="size-4" /></div>
              <p className="text-xs leading-4 text-[#355540]"><strong className="block font-semibold text-[#193d2b]">Curated for discovery</strong>Start with a feeling, not a filter.</p>
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-[1440px] scroll-mt-6 px-5 py-10 md:px-10 lg:px-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b85a3f]">Begin anywhere</p>
              <h2 className="mt-2 font-['Playfair_Display'] text-3xl tracking-[-0.04em] text-[#193d2b] sm:text-4xl">Browse a world of possibility.</h2>
            </div>
            <button onClick={() => setLocation("/listings")} className="group flex items-center gap-1 text-sm font-semibold text-[#193d2b]">All categories <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map(({ name, hint, icon: Icon, tone }) => (
              <button key={name} onClick={() => setLocation(`/listings?category=${encodeURIComponent(name)}`)} className="group rounded-[1.4rem] border border-[#193d2b]/8 bg-[#fcfbf7] p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-[#193d2b]/20 hover:shadow-[0_20px_35px_-28px_rgba(25,61,43,0.8)]">
                <div className={`mb-9 grid size-11 place-items-center rounded-2xl ${tone} text-[#193d2b]`}><Icon className="size-5" /></div>
                <div className="flex items-end justify-between gap-3"><div><h3 className="font-semibold text-[#193d2b]">{name}</h3><p className="mt-1 text-xs leading-4 text-[#5f7566]">{hint}</p></div><ArrowUpRight className="mb-0.5 size-4 shrink-0 text-[#193d2b]/50 transition group-hover:text-[#b85a3f]" /></div>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 lg:px-14">
          <div className="grid overflow-hidden rounded-[2rem] bg-[#193d2b] lg:grid-cols-[0.88fr_1.12fr]">
            <div className="p-8 sm:p-12 lg:p-14">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#c7d0a6] text-[#193d2b]"><Store className="size-5" /></div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7d0a6]">A marketplace built for people</p>
              <h2 className="mt-3 max-w-[390px] font-['Playfair_Display'] text-4xl leading-tight tracking-[-0.04em] text-[#f8f7f0]">Selling should feel as considered as finding.</h2>
              <p className="mt-5 max-w-[440px] leading-7 text-[#d1ddd2]">Build a trusted marketplace presence, publish offers across categories, and meet buyers who are actively searching for what you provide.</p>
              <button onClick={() => storeJourney("seller")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f8f7f0] px-5 py-3 text-sm font-semibold text-[#193d2b] transition hover:-translate-y-0.5 active:scale-[0.97]">Create a seller account <ArrowRight className="size-4" /></button>
            </div>
            <div className="grid gap-px bg-[#f8f7f0]/15 sm:grid-cols-2">
              {[
                ["Your storefront", "A clear place for your products, services, and story.", Store],
                ["Direct connection", "Let interested buyers get in touch without unnecessary steps.", UserRound],
                ["Discovery tools", "Reach people browsing the categories that matter to you.", Search],
                ["Built for trust", "Profiles and offers live inside a shared marketplace system.", ShieldCheck],
              ].map(([title, description, Icon]) => <div key={title as string} className="bg-[#204733] p-7 sm:p-8"><Icon className="size-5 text-[#c7d0a6]" /><h3 className="mt-10 font-semibold text-[#f8f7f0]">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#b9c9bd]">{description as string}</p></div>)}
            </div>
          </div>
        </section>

        <section id="premium" className="mx-auto max-w-[1440px] scroll-mt-6 px-5 pb-16 pt-6 md:px-10 lg:px-14 lg:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#b85a3f]/15 bg-[#f4ebe1] p-7 sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-14">
            <Gem className="absolute -right-8 -top-8 size-44 text-[#d87b5e]/10" strokeWidth={1} />
            <div className="relative max-w-[680px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8f2] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b85a3f]"><Gem className="size-3.5" /> Crafted+</div>
              <h2 className="mt-5 font-['Playfair_Display'] text-4xl tracking-[-0.045em] text-[#603326] sm:text-5xl">A little more for the way you move.</h2>
              <p className="mt-4 max-w-[620px] text-base leading-7 text-[#795443]">Premium membership brings elevated discovery, tailored marketplace support, and a more visible presence when you are ready to be found.</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#704738]"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#b85a3f]" />Enhanced visibility</span><span className="flex items-center gap-2"><Sparkles className="size-4 text-[#b85a3f]" />Tailored assistance</span><span className="flex items-center gap-2"><Heart className="size-4 text-[#b85a3f]" />Saved discovery</span></div>
            </div>
            <button onClick={() => storeJourney("buyer")} className="relative mt-8 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#b85a3f] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#a84b34] active:scale-[0.97] lg:mt-0">Explore Crafted+ <ArrowRight className="size-4" /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#193d2b]/10 px-5 py-8 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-[#193d2b] text-[10px] font-bold text-[#f8f7f0]">C</span><span className="text-xs font-semibold tracking-[0.12em] text-[#193d2b]">CRAFTED MEN</span></div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#587060]"><button onClick={() => setLocation("/listings")} className="hover:text-[#b85a3f]">Explore listings</button><button onClick={() => storeJourney("seller")} className="hover:text-[#b85a3f]">Sell on Crafted Men</button><span className="flex items-center gap-1"><MapPin className="size-3.5" /> Made for wherever you are</span></div>
        </div>
      </footer>
    </div>
  );
}
