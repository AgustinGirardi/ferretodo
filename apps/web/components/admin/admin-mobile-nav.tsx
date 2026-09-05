"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/layout/logo-mark";
import { AdminNav } from "./admin-nav";

/**
 * Menú del panel para celular: en pantallas chicas la barra lateral está oculta,
 * así que sin esto no se puede pasar de una sección a otra desde el teléfono.
 */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al navegar a otra sección.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="md:hidden"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6 text-fg" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
                  <LogoMark className="h-6 w-6" />
                  <span>
                    FERRE<span className="text-brand-500">TODO</span>
                  </span>
                </span>
                <p className="text-xs text-muted">Administración</p>
              </div>
              <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-fg" />
              </button>
            </div>
            <AdminNav />
          </div>
        </div>
      )}
    </>
  );
}
