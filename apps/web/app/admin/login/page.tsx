"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { LogoMark } from "@/components/layout/logo-mark";
import { login, type LoginState } from "../actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-fg">
            <LogoMark className="h-8 w-8" />
            <span>
              FERRE<span className="text-brand-500">TODO</span>
            </span>
          </span>
          <p className="mt-1 text-sm text-muted">Panel de administración</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-fg">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@ferretodo.com.ar"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-fg">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
            />
          </label>

          {state.error && (
            <p className="rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">{state.error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
            <Lock className="h-4 w-4" /> {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
