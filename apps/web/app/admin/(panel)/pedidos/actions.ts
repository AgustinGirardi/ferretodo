"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const VALID = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

export async function updateOrderStatus(id: string, status: string) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!VALID.includes(status)) return;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || order.status === status) return;

    // Al cancelar se repone el stock; si se revierte la cancelación se vuelve
    // a descontar (puede quedar negativo: señal de sobreventa para el dueño).
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const it of order.items) {
        await tx.product.updateMany({
          where: { id: it.productId },
          data: { stockQty: { increment: it.quantity } },
        });
      }
    } else if (order.status === "CANCELLED" && status !== "CANCELLED") {
      for (const it of order.items) {
        await tx.product.updateMany({
          where: { id: it.productId },
          data: { stockQty: { decrement: it.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id }, data: { status } });
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}
