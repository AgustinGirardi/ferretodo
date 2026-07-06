"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema claro/oscuro de la tienda (independiente del panel admin). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="ferretodo-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
