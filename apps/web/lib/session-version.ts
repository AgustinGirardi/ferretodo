import { createHash } from "node:crypto";

/**
 * Huella del hash de contraseña vigente. Viaja dentro del token de sesión (claim
 * `pv`) y se compara contra la base en cada validación.
 *
 * Es lo que hace que cambiar la contraseña cierre las sesiones abiertas en otros
 * dispositivos: los tokens JWT son autocontenidos y no se pueden "revocar", así
 * que la única forma de invalidarlos sin una tabla de sesiones es que lleven algo
 * que cambie con la contraseña. Antes, quien te robaba la sesión seguía adentro
 * durante 7 días (30 en clientes) aunque cambiaras la clave.
 *
 * Se guardan 16 caracteres hexadecimales (64 bits): suficiente para que dos
 * contraseñas distintas no coincidan, y no expone el hash en la cookie.
 */
export function sessionVersion(passwordHash: string | null | undefined): string {
  return createHash("sha256").update(passwordHash ?? "").digest("hex").slice(0, 16);
}
