"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  createWithdrawalRequest,
  type WithdrawalState,
} from "@/app/(shop)/arrepentimiento/actions";

const initial: WithdrawalState = {};

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-brand-500";

export function WithdrawalForm() {
  const [state, formAction, pending] = useActionState(createWithdrawalRequest, initial);

  if (state.ok && state.code) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <h2 className="text-lg font-bold text-fg">Solicitud registrada</h2>
        <p className="mt-1 text-sm text-muted">
          Tu número de constancia es{" "}
          <strong className="text-fg">{state.code}</strong>. Guardalo: también te lo enviamos por
          email. Nos vamos a contactar a la brevedad para coordinar la devolución.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Nombre y apellido *
          <input name="name" required maxLength={120} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Email *
          <input name="email" type="email" required maxLength={200} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Teléfono
          <input name="phone" maxLength={40} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Número de pedido (si lo tenés)
          <input name="orderNumber" maxLength={40} placeholder="FT-2026-12345" className={inputClass} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        ¿Qué producto querés devolver y por qué? (opcional)
        <textarea name="reason" rows={4} maxLength={1000} className={inputClass} />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-cta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar solicitud de arrepentimiento
      </button>
    </form>
  );
}
