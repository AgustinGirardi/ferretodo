/**
 * FERRETODO — Contratos compartidos entre frontend (Next.js) y backend (NestJS).
 * Mantener sincronizado con docs/03-BACKEND.md (formato de API).
 */

// ─────────────── Envoltura de respuestas de la API ───────────────

export interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// ─────────────── Enums de dominio (espejo de Prisma) ───────────────

export const CUSTOMER_TYPES = [
  "particular",
  "empresa",
  "constructor",
  "electricista",
  "gasista",
  "plomero",
  "arquitecto",
] as const;
export type CustomerTypeSlug = (typeof CUSTOMER_TYPES)[number];

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentProvider =
  | "MERCADOPAGO"
  | "TRANSFER"
  | "CASH"
  | "PICKUP"
  | "STRIPE"
  | "PAYPAL"
  | "MODO";

export type ProductUnit =
  | "UNIT"
  | "METER"
  | "KILOGRAM"
  | "LITER"
  | "PACK"
  | "SQUARE_METER";

// ─────────────── DTOs de catálogo (vista pública) ───────────────

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  imageUrl?: string;
  price: string;
  previousPrice?: string;
  discountPct?: number;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: "best_selling" | "newest" | "price_asc" | "price_desc" | "top_rated" | "best_discount";
  page?: number;
  limit?: number;
}
