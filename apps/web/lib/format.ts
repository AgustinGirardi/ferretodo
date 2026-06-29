const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea un monto en pesos argentinos: 89999 -> "$89.999". */
export function formatPrice(amount: number): string {
  return ARS.format(amount);
}
