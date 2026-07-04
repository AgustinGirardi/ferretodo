"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const VALID = ["PENDING", "RESOLVED"];

export async function setWithdrawalStatus(id: string, status: string) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!VALID.includes(status)) return;

  await prisma.withdrawalRequest.update({ where: { id }, data: { status } });
  revalidatePath("/admin/arrepentimientos");
}
