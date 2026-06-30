"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

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
  const root = base || "categoria";
  let slug = root;
  let n = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const iconName = String(formData.get("iconName") ?? "bolt").trim() || "bolt";
  if (!name) return;

  if (id) {
    await prisma.category.update({ where: { id }, data: { name, iconName } });
  } else {
    const count = await prisma.category.count();
    await prisma.category.create({
      data: { name, iconName, slug: await uniqueSlug(slugify(name)), position: count },
    });
  }
  revalidatePath("/admin/categorias");
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
}

export async function deleteCategory(id: string): Promise<DeleteResult> {
  await requireAdmin();
  // Seguridad: no permitir borrar una categoría con productos activos,
  // así la tienda nunca queda con productos "huérfanos".
  const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  if (count > 0) {
    return {
      ok: false,
      error: `Esta categoría tiene ${count} producto(s). Movelos o eliminalos primero.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  return { ok: true };
}
