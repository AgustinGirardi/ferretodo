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
  // Lo que se ve al pegar un link de la tienda en WhatsApp, que es el canal de
  // venta principal. Sin esto se comparte una URL pelada.
  openGraph: {
    type: "website",
    siteName: "FERRETODO",
    locale: "es_AR",
    url: siteUrl,
    title: "FERRETODO — Ferretería y Corralón en Río Cuarto",
    description:
      "Herramientas, materiales de construcción, electricidad y plomería. Envíos en Río Cuarto y retiro en el local.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FERRETODO — Ferretería y Corralón" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className={inter.variable}>
        {/* Sin JavaScript, el efecto "aparecer al scrollear" no corre: se fuerza
            el contenido visible para no dejar la home en blanco (SEO/accesibilidad). */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
