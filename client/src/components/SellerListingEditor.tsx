import { ListingImageUploader } from "@/components/ListingImageUploader";
import { MARKETPLACE_CATEGORIES, MarketplaceCategory, formatCategory } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ListingRecord = {
  listing: { id: number; title: string; description: string; category: MarketplaceCategory; priceCents: number | null; currency: string; location: string | null; status: "draft" | "published" | "archived" };
  images: { imageUrl: string }[];
};

export function SellerListingEditor({ listing, onClose }: { listing?: ListingRecord; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory>("services");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const utils = trpc.useUtils();
  const afterSave = () => { utils.marketplace.sellerListings.invalidate(); utils.marketplace.listings.invalidate(); utils.marketplace.nearbyListings.invalidate(); onClose(); };
  const create = trpc.marketplace.createListing.useMutation({ onSuccess: afterSave });
  const update = trpc.marketplace.updateListing.useMutation({ onSuccess: afterSave });

  useEffect(() => {
    setTitle(listing?.listing.title ?? "");
    setDescription(listing?.listing.description ?? "");
    setCategory(listing?.listing.category ?? "services");
    setPrice(listing?.listing.priceCents ? (listing.listing.priceCents / 100).toFixed(2) : "");
    setLocation(listing?.listing.location ?? "");
    setStatus(listing?.listing.status ?? "published");
    setImageUrls(listing?.images.map((image) => image.imageUrl) ?? []);
  }, [listing]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    const data = { title, description, category, currency: "USD", priceCents: Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice * 100) : undefined, location: location || undefined, imageUrls };
    if (listing) update.mutate({ ...data, listingId: listing.listing.id, status }); else create.mutate(data);
  };
  const saving = create.isPending || update.isPending;
  const error = create.error || update.error;

  return <form onSubmit={submit} className="mt-6 rounded-[1.5rem] bg-[#edf0e7] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b85a3f]">{listing ? "Edit listing" : "New listing"}</p><h3 className="mt-1 font-['Playfair_Display'] text-2xl text-[#193d2b]">{listing ? "Refine your offer." : "Share your next offer."}</h3></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-[#193d2b]/15 bg-white text-[#193d2b]" aria-label="Close listing editor"><X className="size-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#355540]">Listing title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#193d2b]/12 bg-white px-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2" placeholder="What are you offering?" required minLength={3} /></label><label className="text-sm font-semibold text-[#355540]">Category<select value={category} onChange={(event) => setCategory(event.target.value as MarketplaceCategory)} className="mt-2 h-11 w-full rounded-xl border border-[#193d2b]/12 bg-white px-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2">{MARKETPLACE_CATEGORIES.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}</select></label></div><label className="mt-4 block text-sm font-semibold text-[#355540]">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28 w-full resize-none rounded-xl border border-[#193d2b]/12 bg-white p-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2" placeholder="Share the essential details buyers should know." required minLength={20} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#355540]">Price in USD <span className="font-normal text-[#7f9084]">(optional)</span><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#193d2b]/12 bg-white px-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2" placeholder="0.00" /></label><label className="text-sm font-semibold text-[#355540]">Location <span className="font-normal text-[#7f9084]">(optional)</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#193d2b]/12 bg-white px-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2" placeholder="City or region" /></label></div>{listing && <label className="mt-4 block text-sm font-semibold text-[#355540]">Visibility<select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published" | "archived")} className="mt-2 h-11 w-full rounded-xl border border-[#193d2b]/12 bg-white px-3 font-normal outline-none ring-[#b85a3f]/30 focus:ring-2"><option value="published">Live in the directory</option><option value="draft">Pause as draft</option><option value="archived">Archive listing</option></select></label>}<ListingImageUploader imageUrls={imageUrls} onChange={setImageUrls} />{error && <p className="mt-3 text-sm text-[#b85a3f]">{error.message}</p>}<button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#193d2b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : listing ? "Save listing" : "Publish listing"}{!saving && <ArrowRight className="size-4" />}</button></form>;
}
