"use client";

import { usePathname } from "next/navigation";

/**
 * Oculta a sus hijos cuando la ruta actual coincide con alguno de los prefijos.
 * Los hijos se renderizan en el server igual (vienen como prop): esto solo
 * decide si se muestran o no en el cliente.
 */
export function HideOnRoutes({
  routes,
  children,
}: {
  routes: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hidden = routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (hidden) return null;
  return <>{children}</>;
}
