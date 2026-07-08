"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

/**
 * Botón "Panel" del header: solo lo ve el admin con sesión iniciada.
 * Se consulta al server por fetch para no volver dinámicas todas las páginas
 * de la tienda (leer cookies en el header forzaría SSR en cada request).
 */
export function AdminPanelLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/whoami", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data?.admin) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 rounded-md border border-brand-500/50 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white dark:bg-transparent dark:text-brand-500 dark:hover:bg-brand-500 dark:hover:text-white"
    >
      <LayoutDashboard className="h-4 w-4" />
      <span className="hidden md:inline">Panel admin</span>
    </Link>
  );
}
