import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "FERRETODO — Ferretería y Corralón en Río Cuarto",
    template: "%s | FERRETODO",
  },
  description:
    "Comprá herramientas, materiales de construcción, electricidad y plomería. Envíos en Río Cuarto y retiro en el local. Cuotas y precios para profesionales.",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
