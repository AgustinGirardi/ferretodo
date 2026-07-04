// Límite de intentos de login en memoria (suficiente para una sola instancia).
// Tras 5 intentos fallidos se bloquea la cuenta por 15 minutos.

const attempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

/** Minutos restantes de bloqueo para esta clave (0 = no bloqueada). */
export function lockedMinutes(key: string): number {
  const a = attempts.get(key);
  if (!a || a.lockedUntil <= Date.now()) return 0;
  return Math.ceil((a.lockedUntil - Date.now()) / 60_000);
}

export function recordFailure(key: string) {
  const a = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = Date.now() + LOCK_MS;
    a.count = 0;
  }
  attempts.set(key, a);
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
