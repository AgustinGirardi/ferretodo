// Limitador de frecuencia simple en memoria (suficiente para una sola instancia).

const hits = new Map<string, number[]>();

/** Tope de claves vivas. Por encima se barren las que ya no tienen eventos
 *  dentro de su ventana: sin esto el mapa crece con cada IP que pasa por la
 *  tienda y nunca se libera (el proceso de Render corre semanas sin reiniciar). */
const MAX_KEYS = 5000;

function prune(now: number, windowMs: number) {
  if (hits.size <= MAX_KEYS) return;
  for (const [key, times] of hits) {
    const last = times[times.length - 1];
    if (last === undefined || now - last >= windowMs) hits.delete(key);
  }
}

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
  prune(now, windowMs);
  return false;
}
