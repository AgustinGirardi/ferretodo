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
 *
 * `sessionEpoch` existe porque el hash solo no alcanza para los clientes: una
 * cuenta creada con Google no tiene contraseña, así que su huella era la del
 * vacío —la MISMA constante para toda esa cohorte— y la comparación no podía
 * fallar nunca. En los hechos esas sesiones eran irrevocables durante 30 días.
 * El epoch es un contador que se incrementa cuando hay que expulsar sesiones
 * (vincular Google sobre una cuenta local, "cerrar sesión en todos lados"), y
 * al entrar en la huella invalida los tokens ya emitidos aunque no haya
 * contraseña que cambiar.
 */
export function sessionVersion(
  passwordHash: string | null | undefined,
  sessionEpoch: number = 0,
): string {
  return createHash("sha256")
    .update(`${passwordHash ?? ""}|${sessionEpoch}`)
    .digest("hex")
    .slice(0, 16);
}
