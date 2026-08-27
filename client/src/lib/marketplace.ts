import { CarFront, House, Laptop, Shirt, Wrench } from "lucide-react";

export const MARKETPLACE_CATEGORIES = ["clothing", "cars", "homes", "electronics", "services"] as const;
export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const categoryPresentation: Record<MarketplaceCategory, { label: string; icon: typeof Shirt; tone: string }> = {
  clothing: { label: "Clothing", icon: Shirt, tone: "bg-[#eee8dd]" },
  cars: { label: "Cars", icon: CarFront, tone: "bg-[#dce8e1]" },
  homes: { label: "Homes", icon: House, tone: "bg-[#e8e4ef]" },
  electronics: { label: "Electronics", icon: Laptop, tone: "bg-[#e1e9ed]" },
  services: { label: "Services", icon: Wrench, tone: "bg-[#f0e3db]" },
};

export function formatCategory(value: string) {
  return categoryPresentation[value as MarketplaceCategory]?.label ?? value;
}

export function formatPrice(priceCents: number | null, currency: string) {
  if (!priceCents) return "Price on request";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(priceCents / 100);
}
