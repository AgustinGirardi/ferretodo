"use client";

import { useState } from "react";
import { RatingStars } from "./rating-stars";
import type { ProductSpec } from "@/lib/catalog-data";

interface ProductTabsProps {
  longDescription: string;
  specs: ProductSpec[];
  rating: number;
  reviewCount: number;
}

type Tab = "desc" | "specs" | "reviews" | "questions";

export function ProductTabs({ longDescription, specs, rating, reviewCount }: ProductTabsProps) {
  const [tab, setTab] = useState<Tab>("desc");

  const tabs: { id: Tab; label: string }[] = [
    { id: "desc", label: "Descripción" },
    { id: "specs", label: "Especificaciones" },
    { id: "reviews", label: `Opiniones (${reviewCount})` },
    { id: "questions", label: "Preguntas" },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "desc" && (
          <p className="max-w-3xl text-sm leading-relaxed text-fg">{longDescription}</p>
        )}

        {tab === "specs" && (
          <table className="w-full max-w-2xl text-sm">
            <tbody>
              {specs.map((s, i) => (
                <tr key={s.name} className={i % 2 === 0 ? "bg-surface" : ""}>
                  <th className="w-1/3 px-4 py-2.5 text-left font-medium text-fg">{s.name}</th>
                  <td className="px-4 py-2.5 text-muted">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "reviews" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-fg">{rating.toFixed(1)}</span>
              <div>
                <RatingStars rating={rating} />
                <p className="text-sm text-muted">{reviewCount} opiniones</p>
              </div>
            </div>
            <p className="text-sm text-muted">
              Las opiniones de clientes se mostrarán acá cuando conectemos la tienda.
            </p>
          </div>
        )}

        {tab === "questions" && (
          <p className="text-sm text-muted">
            ¿Tenés una duda sobre este producto? Escribinos por WhatsApp y te respondemos al
            instante.
          </p>
        )}
      </div>
    </div>
  );
}
