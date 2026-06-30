"use client";

import { useTransition } from "react";
import { ORDER_STATUSES } from "@/lib/order-status";
import { updateOrderStatus } from "@/app/admin/(panel)/pedidos/actions";

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        startTransition(() => updateOrderStatus(id, value));
      }}
      className="input w-auto"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
