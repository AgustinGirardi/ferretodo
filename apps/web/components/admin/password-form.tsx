"use client";

import { useActionState } from "react";
import { Check, KeyRound } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { changePassword, type PasswordState } from "@/app/admin/(panel)/cuenta/actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <Field label="Contraseña actual">
        <input name="current" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <Field label="Nueva contraseña">
        <input name="next" type="password" required autoComplete="new-password" minLength={8} className="input" placeholder="Mínimo 8 caracteres" />
      </Field>
      <Field label="Repetir nueva contraseña">
        <input name="confirm" type="password" required autoComplete="new-password" className="input" />
      </Field>

      {state.error && (
        <p className="rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">{state.error}</p>
      )}
      {state.ok && (
        <p className="inline-flex items-center gap-1 rounded-md bg-[#e1f5ee] px-3 py-2 text-sm text-[#085041]">
          <Check className="h-4 w-4" /> Contraseña actualizada.
        </p>
      )}

      <div className="pt-1">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          <KeyRound className="h-4 w-4" /> {pending ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
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
