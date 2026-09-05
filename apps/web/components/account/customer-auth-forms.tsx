"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { registerCustomer, loginCustomer, type AuthState } from "@/app/(shop)/cuenta/actions";

const initial: AuthState = {};

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted focus:border-brand-500";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 33C9.7 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export function CustomerAuthForms({
  googleEnabled = false,
  oauthError,
}: {
  googleEnabled?: boolean;
  oauthError?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex rounded-md border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "login" ? "bg-brand-cta text-white" : "text-muted hover:text-fg"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "register" ? "bg-brand-cta text-white" : "text-muted hover:text-fg"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {oauthError && (
        <p className="mb-4 rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">{oauthError}</p>
      )}

      {googleEnabled && (
        <>
          {/* Sirve para iniciar sesión Y para crear la cuenta si no existe. */}
          <a
            href="/api/auth/google"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-bg px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface"
          >
            <GoogleIcon />
            Continuar con Google
          </a>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            o con tu email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {mode === "login" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

function useAuthSuccess(pending: boolean, state: AuthState) {
  const router = useRouter();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      if (state.admin) {
        // Credenciales de admin: directo al panel (navegación completa para
        // que el middleware vea la cookie recién creada).
        window.location.assign("/admin");
      } else {
        router.refresh();
      }
    }
    wasPending.current = pending;
  }, [pending, state, router]);
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginCustomer, initial);
  useAuthSuccess(pending, state);

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
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-cta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Iniciar sesión
      </button>
    </form>
  );
}

function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerCustomer, initial);
  useAuthSuccess(pending, state);

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
        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-cta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear cuenta
      </button>
    </form>
  );
}
