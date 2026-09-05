"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { NumberInput } from "@/components/admin/number-input";
import { saveProduct, type ProductFormState } from "@/app/admin/(panel)/productos/actions";

export interface ProductFormData {
  id?: string;
  name: string;
  categoryId: string;
  brandId: string;
  price: number | "";
  previousPrice: number | "";
  cost: number | "";
  stockQty: number | "";
  sku: string;
  iconName: string;
  imageUrl: string;
  shortDescription: string;
  longDescription: string;
  specsText: string;
  tags: string;
  isFeatured: boolean;
  isNew: boolean;
}

const ICONS: [string, string][] = [
  ["plug", "Herramienta eléctrica"],
  ["wrench", "Llave / herramienta"],
  ["hammer", "Martillo"],
  ["zap", "Electricidad"],
  ["droplets", "Plomería"],
  ["paintBucket", "Pinturería"],
  ["hardHat", "Construcción"],
  ["bolt", "Ferretería / bulón"],
  ["shovel", "Jardín"],
  ["shieldCheck", "Seguridad"],
];

interface Props {
  product: ProductFormData;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export function ProductForm({ product, categories, brands }: Props) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
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
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {/* Imagen */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">Foto del producto</label>
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
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
            {imageUrl ? (
              <Image src={imageUrl} alt="Vista previa" fill sizes="80px" className="object-cover" />
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
                <X className="h-3 w-3" /> Quitar foto
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

      {/* Nombre */}
      <Field label="Nombre del producto" required>
        <input name="name" defaultValue={product.name} required className="input" placeholder="Taladro percutor…" />
      </Field>

      {/* Categoría + Marca */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría" required>
          <select name="categoryId" defaultValue={product.categoryId} required className="input">
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Marca">
          <select name="brandId" defaultValue={product.brandId} className="input">
            <option value="">Sin marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Precios */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Precio (sin centavos)" required>
          <NumberInput name="price" defaultValue={product.price} required placeholder="89.999" />
        </Field>
        <Field label="Precio anterior (tachado)">
          <NumberInput name="previousPrice" defaultValue={product.previousPrice} placeholder="119.999" />
        </Field>
        <Field label="Costo (privado)">
          <NumberInput name="cost" defaultValue={product.cost} placeholder="62.000" />
        </Field>
      </div>

      {/* Stock + SKU */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stock disponible">
          <NumberInput name="stockQty" defaultValue={product.stockQty} placeholder="24" />
        </Field>
        <Field label="Código / SKU">
          <input name="sku" defaultValue={product.sku} className="input" placeholder="BOSCH-GSB13RE" />
        </Field>
      </div>

      {/* Ícono (cuando no hay foto) */}
      <Field label="Ícono (se muestra si el producto no tiene foto)">
        <select name="iconName" defaultValue={product.iconName} className="input">
          {ICONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      {/* Descripciones */}
      <Field label="Descripción corta">
        <input name="shortDescription" defaultValue={product.shortDescription} className="input" placeholder="Resumen breve que aparece en la lista" />
      </Field>
      <Field label="Descripción larga">
        <textarea name="longDescription" defaultValue={product.longDescription} rows={4} className="input" placeholder="Detalle completo del producto…" />
      </Field>

      {/* Especificaciones */}
      <Field label="Especificaciones (una por línea, formato «Nombre: Valor»)">
        <textarea
          name="specs"
          defaultValue={product.specsText}
          rows={4}
          className="input"
          placeholder={"Potencia: 650 W\nMandril: 13 mm"}
        />
      </Field>

      {/* Tags */}
      <Field label="Etiquetas (separadas por coma)">
        <input name="tags" defaultValue={product.tags} className="input" placeholder="taladro, percutor, bosch" />
      </Field>

      {/* Flags */}
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="h-4 w-4 accent-brand-500" />
          Destacado en la home
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" name="isNew" defaultChecked={product.isNew} className="h-4 w-4 accent-brand-500" />
          Es novedad
        </label>
      </div>

      {state.error && (
        <p className="inline-flex items-center gap-1.5 rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      )}

      <div className="flex gap-3 border-t border-border pt-5">
        <Button type="submit" variant="primary" size="lg" disabled={uploading || pending}>
          {pending ? "Guardando…" : "Guardar producto"}
        </Button>
        <Link href="/admin/productos">
          <Button type="button" variant="outline" size="lg">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-fg">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
