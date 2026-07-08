"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = base || "producto";
  let slug = root;
  let n = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

// Tope del Int con signo de 32 bits que usa SQLite/Prisma: valores mayores
// harían fallar el insert. Se recorta a ese máximo por seguridad (el input del
// admin ya limita a 9 dígitos, esto es defensa en el server).
const MAX_INT32 = 2_147_483_647;

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Math.round(Number(s));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(MAX_INT32, n));
}

function parseSpecs(raw: string): string {
  const specs = raw
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const name = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      return name && value ? { name, value } : null;
    })
    .filter(Boolean);
  return JSON.stringify(specs);
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const brandId = String(formData.get("brandId") ?? "").trim();
  const price = intOrNull(formData.get("price"));

  if (!name || !categoryId || price === null || price <= 0) {
    // Validación mínima; la UI ya marca los campos requeridos.
    return;
  }

  const data = {
    name,
    categoryId,
    brandId: brandId || null,
    price,
    previousPrice: intOrNull(formData.get("previousPrice")),
    cost: intOrNull(formData.get("cost")),
    stockQty: intOrNull(formData.get("stockQty")) ?? 0,
    sku: String(formData.get("sku") ?? "").trim(),
    iconName: String(formData.get("iconName") ?? "bolt").trim() || "bolt",
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    shortDescription: String(formData.get("shortDescription") ?? "").trim(),
    longDescription: String(formData.get("longDescription") ?? "").trim(),
    specsJson: parseSpecs(String(formData.get("specs") ?? "")),
    tags: String(formData.get("tags") ?? "").trim(),
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on",
  };

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({
      data: { ...data, slug: await uniqueSlug(slugify(name)) },
    });
  }

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  // Borrado seguro: se oculta de la tienda pero no se destruye.
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidatePath("/admin/productos");
}
