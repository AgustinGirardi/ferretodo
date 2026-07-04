import { prisma } from "./prisma";

export type SalesPeriod = "hoy" | "7" | "30" | "todo";

export const SALES_PERIODS: { key: SalesPeriod; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "7", label: "7 días" },
  { key: "30", label: "30 días" },
  { key: "todo", label: "Todo" },
];

export function asPeriod(v: string | undefined): SalesPeriod {
  return (SALES_PERIODS.some((p) => p.key === v) ? v : "30") as SalesPeriod;
}

function periodStart(period: SalesPeriod): Date | null {
  if (period === "todo") return null;
  if (period === "hoy") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);
}

export async function getOrdersForPeriod(period: SalesPeriod) {
  const from = periodStart(period);
  return prisma.order.findMany({
    where: from ? { createdAt: { gte: from } } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}
