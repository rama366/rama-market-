export function getFallbackMarkerPosition(center: { lat: number; lng: number }, latitudeE6: number, longitudeE6: number) {
  return {
    left: `${Math.max(8, Math.min(92, 50 + ((longitudeE6 / 1_000_000 - center.lng) / 0.18) * 100))}%`,
    top: `${Math.max(10, Math.min(90, 50 - ((latitudeE6 / 1_000_000 - center.lat) / 0.12) * 100))}%`,
  };
}
