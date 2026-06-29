import {
  Plug,
  Wrench,
  Hammer,
  Zap,
  Droplets,
  PaintBucket,
  HardHat,
  Bolt,
  Shovel,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Registro de íconos por nombre. Permite referenciar íconos como string en los
 * datos y resolverlos donde se rendericen — necesario para pasar productos de
 * Server Components a Client Components (no se pueden serializar funciones).
 */
export const iconMap = {
  plug: Plug,
  wrench: Wrench,
  hammer: Hammer,
  zap: Zap,
  droplets: Droplets,
  paintBucket: PaintBucket,
  hardHat: HardHat,
  bolt: Bolt,
  shovel: Shovel,
  shieldCheck: ShieldCheck,
} as const;

export type IconName = keyof typeof iconMap;

export type { LucideIcon };
