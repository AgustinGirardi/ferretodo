"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Teclado de un panel modal (los drawers de menú y de filtros).
 *
 * Hace tres cosas que antes faltaban: Escape cierra; el foco arranca dentro del
 * panel y el Tab no se escapa al fondo, que está tapado por el overlay y no se
 * ve; y al cerrar el foco vuelve al botón que lo abrió, en vez de al principio
 * de la página.
 *
 * Devuelve el ref que hay que poner en el contenedor del panel.
 */
export function useModalKeys(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  // El callback va por ref para que el efecto dependa solo de `open`: con una
  // función inline en las dependencias se re-ejecutaría en cada render y le
  // robaría el foco al usuario mientras navega el panel.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  return panelRef;
}
