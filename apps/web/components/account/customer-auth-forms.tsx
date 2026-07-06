"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { registerCustomer, loginCustomer, type AuthState } from "@/app/(shop)/cuenta/actions";

const initial: AuthState = {};

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted focus:border-brand-500";

export function CustomerAuthForms() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex rounded-md border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "login" ? "bg-brand-500 text-white" : "text-muted hover:text-fg"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "register" ? "bg-brand-500 text-white" : "text-muted hover:text-fg"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {mode === "login" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

function useRefreshOnSuccess(pending: boolean, state: AuthState) {
  const router = useRouter();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state, router]);
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginCustomer, initial);
  useRefreshOnSuccess(pending, state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Email
        <input name="email" type="email" required className={inputClass} placeholder="juan@email.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Contraseña
        <input name="password" type="password" required className={inputClass} />
      </label>

      {state.error && (
        <p className="rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Iniciar sesión
      </button>
    </form>
  );
}

function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerCustomer, initial);
  useRefreshOnSuccess(pending, state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Nombre y apellido
        <input name="name" required maxLength={120} className={inputClass} placeholder="Juan Pérez" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Email
        <input name="email" type="email" required maxLength={200} className={inputClass} placeholder="juan@email.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Teléfono (opcional)
        <input name="phone" maxLength={40} className={inputClass} placeholder="0358 ..." />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Contraseña
        <input name="password" type="password" required minLength={8} className={inputClass} />
        <span className="text-xs font-normal text-muted">Mínimo 8 caracteres.</span>
      </label>

      {state.error && (
        <p className="rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear cuenta
      </button>
    </form>
  );
}
