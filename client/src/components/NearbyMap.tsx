import { MapView } from "@/components/Map";
import { getFallbackMarkerPosition } from "@/lib/nearby";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type NearbyItem = {
  listing: { id: number; title: string };
  seller: { latitudeE6: number | null; longitudeE6: number | null; businessName: string | null; displayName: string };
  distanceKm: number;
};

export function NearbyMap({ center, items }: { center: { lat: number; lng: number }; items: NearbyItem[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [providerUnavailable, setProviderUnavailable] = useState(false);

  const drawMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    markersRef.current.forEach((marker) => marker.map = null);
    markersRef.current = [];
    if (!items.length) {
      map.setCenter(center);
      map.setZoom(11);
      return;
    }
    const bounds = new google.maps.LatLngBounds(center);
    markersRef.current = items.flatMap((item) => {
      if (item.seller.latitudeE6 === null || item.seller.longitudeE6 === null) return [];
      const position = { lat: item.seller.latitudeE6 / 1_000_000, lng: item.seller.longitudeE6 / 1_000_000 };
      bounds.extend(position);
      return [new google.maps.marker.AdvancedMarkerElement({ map, position, title: `${item.listing.title} — ${item.seller.businessName || item.seller.displayName}` })];
    });
    map.fitBounds(bounds, 56);
  }, [center, items]);

  useEffect(() => { drawMarkers(); }, [drawMarkers]);

  return <div className="relative overflow-hidden rounded-[1.7rem] border border-[#193d2b]/10 bg-[#e4eadb]">{providerUnavailable ? <div className="relative h-[400px] overflow-hidden bg-[#e4eadb] sm:h-[470px]"><div className="absolute inset-0 opacity-45 [background-image:linear-gradient(#b7c7b866_1px,transparent_1px),linear-gradient(90deg,#b7c7b866_1px,transparent_1px)] [background-size:48px_48px]" /><div className="absolute inset-[11%] rounded-[3rem] border border-dashed border-[#7d9c85]/60" /><div className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[#f7f6f1] bg-[#b85a3f] text-white shadow-lg"><MapPin className="size-4" /></div>{items.map((item) => item.seller.latitudeE6 !== null && item.seller.longitudeE6 !== null ? <div key={item.listing.id} style={getFallbackMarkerPosition(center, item.seller.latitudeE6, item.seller.longitudeE6)} className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#f7f6f1] bg-[#193d2b] text-[10px] font-bold text-white shadow-md">{item.distanceKm.toFixed(0)}</div> : null)}<div className="absolute bottom-4 left-4 max-w-xs rounded-2xl bg-[#fcfbf7]/95 px-4 py-3 text-xs leading-5 text-[#4e6957] shadow-sm">Local-area view shown. The detailed map provider is unavailable right now; nearby listings and distance filters still work.</div></div> : <MapView initialCenter={center} initialZoom={11} onMapReady={(map) => { mapRef.current = map; drawMarkers(); }} onMapError={() => setProviderUnavailable(true)} className="h-[400px] sm:h-[470px]" />}<div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#fcfbf7]/95 px-3 py-2 text-xs font-semibold text-[#193d2b] shadow-sm backdrop-blur"><MapPin className="size-3.5 text-[#b85a3f]" />{items.length} nearby {items.length === 1 ? "listing" : "listings"}</div></div>;
}
