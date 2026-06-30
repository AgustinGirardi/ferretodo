"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { iconMap, type IconName } from "@/lib/icons";

const tints = ["bg-surface", "bg-brand-50", "bg-orange-50", "bg-[#f1f5f9]"];

/**
 * Galería de producto. Mientras no haya imágenes reales, muestra el ícono del
 * producto sobre distintos fondos a modo de "fotos". Al conectar la API se
 * reemplaza por <Image> de Cloudinary (ver docs/04-FRONTEND.md).
 */
export function ProductGallery({ iconName, alt }: { iconName: IconName; alt: string }) {
  const [active, setActive] = useState(0);
  const Icon = iconMap[iconName];

  return (
    <div className="flex flex-col-reverse items-start gap-3 sm:flex-row">
      <div className="flex shrink-0 gap-3 sm:flex-col">
        {tints.map((tint, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className={`flex h-16 w-16 items-center justify-center rounded-md border ${tint} ${
              active === i ? "border-brand-500" : "border-border"
            }`}
          >
            <Icon className="h-7 w-7 text-muted/50" strokeWidth={1.25} />
          </button>
        ))}
      </div>

      <div
        className={`relative flex aspect-square w-full min-w-0 flex-1 items-center justify-center rounded-xl border border-border ${tints[active]}`}
      >
        <Icon className="h-28 w-28 text-muted/40 sm:h-36 sm:w-36" strokeWidth={0.75} aria-label={alt} />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-bg/80 px-2 py-1 text-xs text-muted">
          <ZoomIn className="h-3.5 w-3.5" /> Zoom
        </span>
      </div>
    </div>
  );
}
