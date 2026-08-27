import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useState } from "react";

type ListingImageUploaderProps = { imageUrls: string[]; onChange: (imageUrls: string[]) => void };

function asDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

export function ListingImageUploader({ imageUrls, onChange }: ListingImageUploaderProps) {
  const [localError, setLocalError] = useState("");
  const upload = trpc.marketplace.uploadListingImage.useMutation({
    onSuccess: ({ url }) => onChange([...imageUrls, url]),
    onError: (error) => setLocalError(error.message || "The image could not be uploaded."),
  });
  const pickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || upload.isPending) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setLocalError("Choose a PNG, JPEG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setLocalError("Choose an image smaller than 8 MB."); return; }
    setLocalError("");
    try { upload.mutate({ dataUrl: await asDataUrl(file) }); } catch (error) { setLocalError(error instanceof Error ? error.message : "The image could not be read."); }
  };

  return <div className="mt-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[#355540]">Listing photos <span className="font-normal text-[#7f9084]">(up to 6)</span></p><p className="mt-1 text-xs text-[#66806e]">A clear first photo will become the listing cover.</p></div><label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#193d2b]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#193d2b] transition hover:border-[#193d2b]/35 ${imageUrls.length >= 6 || upload.isPending ? "pointer-events-none opacity-55" : ""}`}><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} disabled={imageUrls.length >= 6 || upload.isPending} />{upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{upload.isPending ? "Uploading..." : "Add photo"}</label></div>{imageUrls.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{imageUrls.map((url, index) => <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-[#dfe6da]"><img src={url} alt={`Listing image ${index + 1}`} className="h-full w-full object-cover" />{index === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-[#193d2b]/85 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Cover</span>}<button type="button" onClick={() => onChange(imageUrls.filter((value) => value !== url))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-[#193d2b]/85 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label={`Remove image ${index + 1}`}><X className="size-3.5" /></button></div>)}</div>}{(localError || upload.error) && <p className="mt-2 text-xs text-[#b85a3f]">{localError || upload.error?.message}</p>}</div>;
}
