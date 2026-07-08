"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hace aparecer su contenido con un fade + subida cuando entra al viewport.
 * El estilo vive en globals.css (.reveal / .reveal-visible) y solo anima si
 * el usuario no tiene activado "reducir movimiento".
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Retardo en ms para escalonar elementos de una misma fila/grilla. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // El margen superior gigante cubre todo lo que quedó ARRIBA del viewport:
      // si el usuario salta de golpe al final (o el navegador restaura el
      // scroll), lo ya pasado se revela igual en vez de quedar invisible.
      { threshold: 0.12, rootMargin: "9999px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`.trim()}
      style={
        delay > 0 ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}
