"use client";

import { useState } from "react";
import type { ProductSpec } from "@/lib/products";

interface ProductTabsProps {
  longDescription: string;
  specs: ProductSpec[];
}

type Tab = "desc" | "specs";

/**
 * Antes había además "Opiniones" y "Preguntas". La primera mostraba una nota
 * interna ("se mostrarán acá cuando conectemos la tienda") y la segunda solo
 * mandaba a WhatsApp: dos de cuatro pestañas vacías a la vista del cliente.
 * Vuelven cuando haya opiniones y preguntas de verdad.
 */
export function ProductTabs({ longDescription, specs }: ProductTabsProps) {
  const [tab, setTab] = useState<Tab>("desc");

  const tabs: { id: Tab; label: string }[] = [
    { id: "desc", label: "Descripción" },
    { id: "specs", label: "Especificaciones" },
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

      </div>
    </div>
  );
}
