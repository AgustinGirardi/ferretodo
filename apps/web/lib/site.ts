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

  /**
   * Cuotas que se anuncian en la tienda. Estaba escrito duro en la tarjeta de
   * producto, la ficha, el carrito y el hero: cuatro lugares para tocar cada vez
   * que cambian las promociones bancarias. Ahora se cambia solo acá.
   * Ojo: mientras Mercado Pago siga simulado, esto es una promesa que hay que
   * poder sostener en el mostrador.
   */
  installments: {
    count: 12,
    label: "12 cuotas sin interés" as string,
  },

  /**
   * Datos para pagar por transferencia. COMPLETAR con los reales del comercio:
   * mientras `alias` y `cbu` estén vacíos, al cliente que elige transferencia se
   * le dice que lo vamos a contactar (que es lo que pasa hoy). Apenas se cargan,
   * aparecen en la pantalla de confirmación y en el email del pedido, y el
   * cliente puede pagar solo.
   */
  bank: {
    alias: "" as string,
    cbu: "" as string,
    holder: "" as string,
    bankName: "" as string,
  },
} as const;

/** true cuando hay datos suficientes para que el cliente transfiera sin llamar. */
export function hasBankDetails(): boolean {
  return Boolean(site.bank.alias || site.bank.cbu);
}

/** Link de WhatsApp con mensaje opcional pre-cargado. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
