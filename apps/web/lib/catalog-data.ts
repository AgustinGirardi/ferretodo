import {
  Plug,
  Wrench,
  Zap,
  Droplets,
  PaintBucket,
  HardHat,
  Bolt,
  Shovel,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type StockStatus = "in" | "low" | "out";

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  previousPrice?: number;
  stock: StockStatus;
  icon: LucideIcon;
}

export interface MockCategory {
  name: string;
  slug: string;
  icon: LucideIcon;
}

/**
 * Datos de muestra para maquetar la home. En Fase 1 se reemplazan por la API
 * (GET /catalog/products, /categories). Ver docs/03-BACKEND.md.
 */
export const categories: MockCategory[] = [
  { name: "Herramientas eléctricas", slug: "herramientas-electricas", icon: Plug },
  { name: "Herramientas manuales", slug: "herramientas-manuales", icon: Wrench },
  { name: "Electricidad", slug: "electricidad", icon: Zap },
  { name: "Plomería", slug: "plomeria", icon: Droplets },
  { name: "Pinturería", slug: "pintureria", icon: PaintBucket },
  { name: "Construcción", slug: "construccion", icon: HardHat },
  { name: "Ferretería", slug: "ferreteria", icon: Bolt },
  { name: "Jardín", slug: "jardin", icon: Shovel },
  { name: "Seguridad", slug: "seguridad", icon: ShieldCheck },
];

export const featuredProducts: MockProduct[] = [
  { id: "1", slug: "taladro-percutor-bosch-gsb-13-re", name: "Taladro percutor Bosch GSB 13 RE 650W", brand: "Bosch", price: 89999, previousPrice: 119999, stock: "in", icon: Plug },
  { id: "2", slug: "amoladora-angular-dewalt-dwe4120", name: "Amoladora angular DeWalt 820W 115mm", brand: "DeWalt", price: 76500, previousPrice: 95000, stock: "in", icon: Wrench },
  { id: "3", slug: "latex-interior-sherwin-20l", name: "Látex interior lavable 20L", brand: "Sherwin Williams", price: 54900, previousPrice: 78000, stock: "low", icon: PaintBucket },
  { id: "4", slug: "cano-pvc-tigre-110", name: "Caño PVC cloacal 110mm x 3m", brand: "Tigre", price: 12300, stock: "in", icon: Droplets },
];

export const bestSellers: MockProduct[] = [
  { id: "5", slug: "cable-unipolar-sica-25", name: "Cable unipolar 2.5mm x 100m", brand: "Sica", price: 24500, stock: "in", icon: Zap },
  { id: "6", slug: "juego-llaves-tramontina", name: "Juego de llaves combinadas 8 piezas", brand: "Tramontina", price: 33900, previousPrice: 41000, stock: "in", icon: Wrench },
  { id: "7", slug: "cemento-50kg", name: "Cemento de albañilería 50kg", brand: "Holcim", price: 9800, stock: "in", icon: HardHat },
  { id: "8", slug: "disyuntor-sica-2x40", name: "Disyuntor diferencial 2x40A", brand: "Sica", price: 28700, previousPrice: 35000, stock: "low", icon: Zap },
];
