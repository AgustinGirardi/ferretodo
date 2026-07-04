/** URL pública del sitio (para metadata, sitemap y robots). */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ferretodo.com.ar";

/** Datos del negocio FERRETODO. Fuente única para header, footer, contacto, etc. */
export const site = {
  name: "FERRETODO",
  tagline: "Ferretería y Corralón",
  phone: "0351-000-0000",
  whatsapp: "5493510000000",
  address: "Av. Ejemplo 1234, Córdoba, Argentina",
  city: "Río Cuarto",
  hours: [
    { days: "Lunes a Viernes", time: "08:00–12:00 y 15:30–19:30" },
    { days: "Sábados", time: "08:30–13:00" },
    { days: "Domingos", time: "Cerrado" },
  ],
  /**
   * URL del QR de Data Fiscal (AFIP) del comercio. Cuando el cliente tenga su
   * formulario 960/D digital, pegar acá el link (http://qr.afip.gob.ar/?qr=...)
   * y el logo aparece automáticamente en el footer.
   */
  afipQrUrl: "" as string,
} as const;

/** Link de WhatsApp con mensaje opcional pre-cargado. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
