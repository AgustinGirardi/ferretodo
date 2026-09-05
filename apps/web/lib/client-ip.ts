import { headers } from "next/headers";

/**
 * IP del visitante, para los límites de frecuencia.
 *
 * `X-Forwarded-For` es una lista y el cliente puede mandar la suya: el proxy
 * agrega la IP real al FINAL. Tomando la primera, cualquiera saltea todos los
 * límites mandando un header distinto en cada request, así que se toma la
 * última, que es la única que escribe el proxy de Render.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const last = h.get("x-forwarded-for")?.split(",").pop()?.trim();
  return last || h.get("x-real-ip")?.trim() || "local";
}
