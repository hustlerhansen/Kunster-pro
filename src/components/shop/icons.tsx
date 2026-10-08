import { CreditCard, Gift, Headset, MapPin, ShieldCheck, Star, Truck } from "lucide-react";
import type { BannerItem } from "@/lib/types";

export const BANNER_ICONS: Record<BannerItem["icon"], typeof Truck> = {
  truck: Truck,
  gift: Gift,
  star: Star,
  card: CreditCard,
  headset: Headset,
  map: MapPin,
  shield: ShieldCheck,
};
