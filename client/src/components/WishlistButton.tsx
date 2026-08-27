import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, Loader2 } from "lucide-react";
import { useMemo } from "react";

export function WishlistButton({ listingId, compact = false }: { listingId: number; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const profile = trpc.marketplace.profile.useQuery(undefined, { enabled: isAuthenticated });
  const wishlist = trpc.marketplace.wishlist.useQuery(undefined, { enabled: profile.data?.accountType === "buyer" });
  const utils = trpc.useUtils();
  const save = trpc.marketplace.saveWishlist.useMutation({ onSuccess: () => utils.marketplace.wishlist.invalidate() });
  const remove = trpc.marketplace.removeWishlist.useMutation({ onSuccess: () => utils.marketplace.wishlist.invalidate() });
  const saved = useMemo(() => wishlist.data?.some(({ listing }) => listing.id === listingId) ?? false, [listingId, wishlist.data]);
  const loading = profile.isLoading || wishlist.isLoading || save.isPending || remove.isPending;

  if (isAuthenticated && profile.data?.accountType === "seller") return null;

  const toggle = () => {
    if (!isAuthenticated) {
      window.localStorage.setItem("rama-marketplace-path", "buyer");
      startLogin();
      return;
    }
    if (!profile.data) {
      window.location.href = "/onboarding?type=buyer";
      return;
    }
    if (saved) remove.mutate({ listingId }); else save.mutate({ listingId });
  };

  const className = compact
    ? `grid size-9 place-items-center rounded-full shadow-sm backdrop-blur transition ${saved ? "bg-[#b85a3f] text-white" : "bg-[#fcfbf7]/90 text-[#193d2b] hover:text-[#b85a3f]"}`
    : `inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${saved ? "border-[#b85a3f] bg-[#fff2ed] text-[#b85a3f]" : "border-[#193d2b]/15 bg-white text-[#193d2b] hover:border-[#b85a3f] hover:text-[#b85a3f]"}`;

  return <button type="button" onClick={toggle} disabled={loading} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} className={className}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" fill={saved ? "currentColor" : "none"} />}{!compact && (saved ? "Saved to wishlist" : "Save to wishlist")}</button>;
}
