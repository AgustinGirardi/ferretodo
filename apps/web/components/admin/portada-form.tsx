"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Check, Wrench, MessageCircle } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { savePortada, type PortadaState } from "@/app/admin/(panel)/portada/actions";
import type { HomeSettings } from "@/lib/settings";

export function PortadaForm({ initial }: { initial: HomeSettings }) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(savePortada, {});
  const [title, setTitle] = useState(initial.heroTitle);
  const [subtitle, setSubtitle] = useState(initial.heroSubtitle);
  const [ctaLabel, setCtaLabel] = useState(initial.heroCtaLabel);
  const [ctaLink, setCtaLink] = useState(initial.heroCtaLink);
  const [imageUrl, setImageUrl] = useState(initial.heroImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* Formulario */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="heroImageUrl" value={imageUrl} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Imagen del banner</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) upload(f);
            }}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-border bg-surface p-4 transition-colors hover:border-brand-500"
          >
            <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
              {imageUrl ? (
                <Image src={imageUrl} alt="Banner" fill sizes="96px" className="object-cover" />
              ) : uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              ) : (
                <Upload className="h-6 w-6 text-muted" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium text-fg">
                {uploading ? "Subiendo…" : "Arrastrá una imagen o tocá para elegir"}
              </p>
              <p className="text-xs text-muted">JPG, PNG o WEBP · hasta 5 MB</p>
              {imageUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl("");
                  }}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-danger hover:underline"
                >
                  <X className="h-3 w-3" /> Quitar (vuelve al ícono)
                </button>
              )}
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>

        <Field label="Título principal">
          <input name="heroTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <Field label="Subtítulo">
          <textarea
            name="heroSubtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            className="input"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Texto del botón">
            <input name="heroCtaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="input" />
          </Field>
          <Field label="Link del botón">
            <input name="heroCtaLink" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} className="input" placeholder="/ofertas" />
          </Field>
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-3 text-sm font-medium text-fg">Franja de beneficios</p>
          <p className="mb-3 text-xs text-muted">
            Los 4 textos que aparecen debajo del banner (los íconos son fijos).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <input
                  name={`benefit${n}Title`}
                  defaultValue={initial[`benefit${n}Title` as keyof typeof initial]}
                  className="input"
                  placeholder={`Beneficio ${n} — título`}
                />
                <input
                  name={`benefit${n}Text`}
                  defaultValue={initial[`benefit${n}Text` as keyof typeof initial]}
                  className="input"
                  placeholder={`Beneficio ${n} — descripción`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-3 text-sm font-medium text-fg">Títulos de secciones</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sección de destacados">
              <input name="featuredTitle" defaultValue={initial.featuredTitle} className="input" />
            </Field>
            <Field label="Sección de más vendidos">
              <input name="bestSellersTitle" defaultValue={initial.bestSellersTitle} className="input" />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-5">
          <Button type="submit" variant="primary" size="lg" disabled={uploading || pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
          {state.saved && !pending && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" /> ¡Guardado! Ya se ve en la tienda.
            </span>
          )}
        </div>
      </form>

      {/* Vista previa en vivo */}
      <div>
        <p className="mb-2 text-sm font-medium text-fg">Vista previa</p>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid gap-4 bg-[#fff7ed] p-5 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <div>
              <h2 className="text-xl font-bold leading-tight text-[#0f172a]">
                {title || "Título de tu portada"}
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">{subtitle || "Subtítulo de tu portada"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-[#d94e04] px-3 py-1.5 text-xs font-medium text-white">
                  {ctaLabel || "Botón"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#16a34a] px-3 py-1.5 text-xs font-medium text-white">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </span>
              </div>
            </div>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-[#ffe7d4]">
              {imageUrl ? (
                <Image src={imageUrl} alt="Vista previa" fill sizes="200px" className="object-cover" />
              ) : (
                <Wrench className="h-16 w-16 text-[#f0997b]" strokeWidth={1} />
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          Así se verá el encabezado de la página de inicio.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}
