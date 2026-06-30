"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const root = base || "marca";
  let slug = root;
  let n = 1;
  while (true) {
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function saveBrand(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  if (id) {
    await prisma.brand.update({ where: { id }, data: { name } });
  } else {
    await prisma.brand.create({ data: { name, slug: await uniqueSlug(slugify(name)) } });
  }
  revalidatePath("/admin/marcas");
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  // Los productos de esta marca quedan "Sin marca" (no se borran ni se rompe nada).
  await prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/marcas");
}
