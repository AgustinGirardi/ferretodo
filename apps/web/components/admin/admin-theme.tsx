"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ferretodo-admin-theme";

interface AdminThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

/**
 * Tema del panel admin, independiente del tema de la tienda (que usa
 * next-themes sobre <html>). Aplica la clase "dark"/"light" directamente
 * sobre su propio contenedor para no depender de lo que herede del ancestro.
 * Por defecto oscuro, como era el panel antes de tener este toggle.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDark(saved === "dark");
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }

  return (
    <AdminThemeContext.Provider value={{ dark, toggle }}>
      <div className={`${dark ? "dark" : "light"} min-h-screen bg-bg text-fg`}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme debe usarse dentro de AdminThemeProvider");
  return ctx;
}
