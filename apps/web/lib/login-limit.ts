// Límite de intentos de login en memoria (suficiente para una sola instancia).
//
// Se bloquea por (cuenta, IP), no por cuenta sola: con la clave por cuenta,
// cualquiera que supiera el email del admin lo dejaba afuera de su propio panel
// con 5 intentos fallidos, repitiéndolo cada 15 minutos para siempre.
//
// Queda además un tope por cuenta mucho más alto, como red contra un ataque
// distribuido desde muchas IPs. Ese tope SÍ podía usarse para dejar afuera al
// titular —bastaba con repartir los fallos entre varias IPs, o con hacer diez
// rondas de quince minutos desde una sola— así que ahora no se aplica a las IPs
// desde las que esa cuenta ya inició sesión con éxito. Un atacante no puede
// entrar en esa lista sin la contraseña, que es justo lo que no tiene.

interface Entry {
  count: number;
  lockedUntil: number;
  seen: number;
}

const attempts = new Map<string, Entry>();

/** IPs desde las que cada cuenta ya logró entrar. Exentas del tope por cuenta. */
const trusted = new Map<string, { ips: Set<string>; seen: number }>();

const MAX_PER_IP = 5;
const MAX_PER_ACCOUNT = 50;
const LOCK_MS = 15 * 60 * 1000;
/** Tope de claves vivas: por encima se limpian las vencidas. */
const MAX_KEYS = 5000;
/** IPs de confianza que se recuerdan por cuenta (las más recientes). */
const MAX_TRUSTED_IPS = 10;
/** Cuánto vale un login exitoso como prueba de que la IP es del titular. */
const TRUSTED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function prune(now: number) {
  for (const [account, entry] of trusted) {
    if (now - entry.seen > TRUSTED_TTL_MS) trusted.delete(account);
  }
  if (attempts.size <= MAX_KEYS) return;
  for (const [key, entry] of attempts) {
    if (entry.lockedUntil <= now && now - entry.seen > LOCK_MS) attempts.delete(key);
  }
}

function isTrusted(account: string, ip: string, now: number): boolean {
  const entry = trusted.get(account);
  if (!entry) return false;
  if (now - entry.seen > TRUSTED_TTL_MS) {
    trusted.delete(account);
    return false;
  }
  return entry.ips.has(ip);
}

function lockUntil(key: string, now: number): number {
  const entry = attempts.get(key);
  return entry && entry.lockedUntil > now ? entry.lockedUntil : 0;
}

/** Minutos restantes de bloqueo para esta cuenta desde esta IP (0 = no bloqueada). */
export function lockedMinutes(account: string, ip: string): number {
  const now = Date.now();
  // El bloqueo por (cuenta, IP) siempre aplica: es el que frena el brute force.
  let until = lockUntil(`${account}|${ip}`, now);
  // El tope por cuenta solo alcanza a IPs desconocidas. Sin esta excepción, un
  // tercero puede dejar al dueño afuera de su propia cuenta indefinidamente.
  if (!isTrusted(account, ip, now)) {
    until = Math.max(until, lockUntil(account, now));
  }
  return until ? Math.ceil((until - now) / 60_000) : 0;
}

export function recordFailure(account: string, ip: string) {
  const now = Date.now();
  const scopes = [
    { key: `${account}|${ip}`, max: MAX_PER_IP },
    { key: account, max: MAX_PER_ACCOUNT },
  ];
  for (const { key, max } of scopes) {
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

/** Login exitoso: se limpia el contador de esta IP y la IP queda registrada como
 *  del titular. El contador de la cuenta se deja, para que un ataque distribuido
 *  no se reinicie con un acierto suelto. */
export function clearFailures(account: string, ip: string) {
  const now = Date.now();
  attempts.delete(`${account}|${ip}`);

  const entry = trusted.get(account) ?? { ips: new Set<string>(), seen: now };
  // Set conserva el orden de inserción: al reinsertar, la IP pasa a ser la más
  // reciente y el recorte de abajo descarta siempre la más vieja.
  entry.ips.delete(ip);
  entry.ips.add(ip);
  while (entry.ips.size > MAX_TRUSTED_IPS) {
    const oldest = entry.ips.values().next().value;
    if (oldest === undefined) break;
    entry.ips.delete(oldest);
  }
  entry.seen = now;
  trusted.set(account, entry);
}
