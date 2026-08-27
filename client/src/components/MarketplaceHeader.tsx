import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Menu, Search, Store, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export function MarketplaceHeader() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = (path: string) => { setOpen(false); setLocation(path); };
  const beginJourney = (type: "buyer" | "seller") => {
    if (isAuthenticated) {
      nav(`/onboarding?type=${type}`);
      return;
    }
    window.localStorage.setItem("rama-marketplace-path", type);
    startLogin();
  };

  return (
    <>
      <header className="relative z-30 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10 lg:px-14">
        <button onClick={() => nav("/")} className="flex items-center gap-2.5 text-left" aria-label="Crafted Men home">
          <span className="grid size-9 place-items-center rounded-full bg-[#193d2b] text-sm font-bold text-[#f8f7f1]">C</span>
          <span className="text-lg font-semibold tracking-[-0.07em] text-[#193d2b]">CRAFTED MEN</span>
          <span className="hidden border-l border-[#193d2b]/20 pl-2 text-[9px] font-medium tracking-[0.16em] text-[#193d2b]/70 sm:inline">MARKETPLACE</span>
        </button>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#31513f] lg:flex">
          <button onClick={() => nav("/listings")} className="transition-colors hover:text-[#b85a3f]">Browse</button>
          <button onClick={() => nav("/listings?filter=nearby")} className="transition-colors hover:text-[#b85a3f]">Near you</button>
          <button onClick={() => nav("/account")} className="transition-colors hover:text-[#b85a3f]">My marketplace</button>
          <button onClick={() => beginJourney("seller")} className="transition-colors hover:text-[#b85a3f]">For sellers</button>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <button onClick={() => beginJourney("buyer")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#193d2b] transition-colors hover:bg-[#193d2b]/5">Sign in</button>
          <button onClick={() => beginJourney("seller")} className="rounded-full bg-[#193d2b] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#285941] active:scale-[0.97]">Start selling</button>
        </div>
        <button onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-full border border-[#193d2b]/15 text-[#193d2b] sm:hidden" aria-label="Open navigation">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        {open && <div className="absolute left-5 right-5 top-[72px] rounded-[1.5rem] border border-[#193d2b]/10 bg-[#fcfbf7] p-3 shadow-xl sm:hidden">
          <button onClick={() => nav("/listings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[#edf0e7]"><Search className="size-4" /> Browse listings</button>
          <button onClick={() => nav("/account")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[#edf0e7]"><Store className="size-4" /> My marketplace</button>
          <button onClick={() => beginJourney("seller")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[#edf0e7]"><Store className="size-4" /> Start selling</button>
        </div>}
      </header>
    </>
  );
}
