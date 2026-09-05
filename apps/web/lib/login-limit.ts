// Límite de intentos de login en memoria (suficiente para una sola instancia).
//
// Se bloquea por (cuenta, IP), no por cuenta sola: con la clave por cuenta,
// cualquiera que supiera el email del admin lo dejaba afuera de su propio panel
// con 5 intentos fallidos, repitiéndolo cada 15 minutos para siempre.
//
// Queda además un tope por cuenta mucho más alto, como red contra un ataque
// distribuido desde muchas IPs. Un atacante solo no puede alcanzarlo, así que no
// sirve para bloquear al titular.

interface Entry {
  count: number;
  lockedUntil: number;
  seen: number;
}

const attempts = new Map<string, Entry>();

const MAX_PER_IP = 5;
const MAX_PER_ACCOUNT = 50;
const LOCK_MS = 15 * 60 * 1000;
/** Tope de claves vivas: por encima se limpian las vencidas. */
const MAX_KEYS = 5000;

function scopes(account: string, ip: string) {
  return [
    { key: `${account}|${ip}`, max: MAX_PER_IP },
    { key: account, max: MAX_PER_ACCOUNT },
  ];
}

function prune(now: number) {
  if (attempts.size <= MAX_KEYS) return;
  for (const [key, entry] of attempts) {
    if (entry.lockedUntil <= now && now - entry.seen > LOCK_MS) attempts.delete(key);
  }
}

/** Minutos restantes de bloqueo para esta cuenta desde esta IP (0 = no bloqueada). */
export function lockedMinutes(account: string, ip: string): number {
  const now = Date.now();
  let until = 0;
  for (const { key } of scopes(account, ip)) {
    const entry = attempts.get(key);
    if (entry && entry.lockedUntil > now) until = Math.max(until, entry.lockedUntil);
  }
  return until ? Math.ceil((until - now) / 60_000) : 0;
}

export function recordFailure(account: string, ip: string) {
  const now = Date.now();
  for (const { key, max } of scopes(account, ip)) {
    const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0, seen: now };
    entry.count += 1;
    entry.seen = now;
    if (entry.count >= max) {
      entry.lockedUntil = now + LOCK_MS;
      entry.count = 0;
    }
    attempts.set(key, entry);
  }
  prune(now);
}

/** Login exitoso: se limpia el contador de esta IP. El de la cuenta se deja,
 *  para que un ataque distribuido no se reinicie con un acierto suelto. */
export function clearFailures(account: string, ip: string) {
  attempts.delete(`${account}|${ip}`);
}
