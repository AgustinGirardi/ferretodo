import { ImageOff } from "lucide-react";
import { iconMap, type IconName } from "@/lib/icons";

/**
 * Marcador para los productos que todavía no tienen foto cargada.
 *
 * Antes acá había una "galería": cuatro miniaturas del mismo ícono sobre fondos
 * de distinto tono y un botón "Zoom" que no hacía nada. Parecía una galería rota
 * y hacía creer que el producto tenía fotos. Un solo marcador honesto es más
 * claro, y deja obvio para el dueño qué productos le falta fotografiar.
 */
export function ProductImagePlaceholder({
  iconName,
  alt,
}: {
  iconName: IconName;
  alt: string;
}) {
  const Icon = iconMap[iconName] ?? iconMap.bolt;

  return (
    <div className="flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface">
      <Icon className="h-24 w-24 text-muted/35 sm:h-32 sm:w-32" strokeWidth={0.75} aria-label={alt} />
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <ImageOff className="h-3.5 w-3.5" /> Sin foto por ahora
      </span>
    </div>
  );
}
