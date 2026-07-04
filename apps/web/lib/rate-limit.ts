// Limitador de frecuencia simple en memoria (suficiente para una sola instancia).

const hits = new Map<string, number[]>();

/** true si la clave ya superó `max` eventos dentro de la ventana `windowMs`. */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}
