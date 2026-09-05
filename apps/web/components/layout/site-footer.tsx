import Link from "next/link";
import { Phone, MapPin, Clock, MessageCircle, BadgePercent } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { getCategories } from "@/lib/products";
import { LogoMark } from "./logo-mark";

export async function SiteFooter() {
  const categories = await getCategories();
  return (
    <footer className="bg-[#0f172a] text-[#cbd5e1]">
      <div className="container mx-auto grid gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="flex items-center gap-2 text-xl font-bold text-white">
            <LogoMark className="h-6 w-6" />
            <span>
              FERRE<span className="text-brand-500">TODO</span>
            </span>
          </span>
          <p className="mt-3 text-sm text-[#94a3b8]">
            {site.tagline} en {site.city}, Córdoba. Todo para tu obra, con envío y retiro en el
            local.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Categorías</h3>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 5).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`} className="hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Contacto</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {site.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" /> {site.phone}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {site.hours.map((h) => (
                  <span key={h.days} className="block">
                    {h.days}: {h.time}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        {/* Acá había un formulario de newsletter que no estaba conectado a nada:
            el visitante dejaba su email, la página se recargaba y no pasaba nada.
            Hasta que exista de verdad, se ofrece el canal que sí funciona. */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Novedades y ofertas</h3>
          <p className="mb-3 text-sm text-[#94a3b8]">
            Escribinos por WhatsApp y te pasamos precios, stock y las promos del mes.
          </p>
          <a
            href={whatsappLink("Hola FERRETODO, quería consultar por precios y ofertas.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
          </a>
          <Link
            href="/ofertas"
            className="mt-3 flex items-center gap-2 text-sm text-[#cbd5e1] hover:text-white"
          >
            <BadgePercent className="h-4 w-4" /> Ver ofertas vigentes
          </Link>
        </div>
      </div>

      <div className="border-t border-[#1e293b]">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-[#64748b] sm:flex-row">
          <span>
            © {new Date().getFullYear()} FERRETODO · Todos los derechos reservados ·{" "}
            {/* Acceso discreto y permanente al panel: si no hay sesión de admin,
                el middleware manda a /admin/login. */}
            <Link href="/admin" className="hover:text-white">
              Administración
            </Link>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/ayuda" className="hover:text-white">
              Cómo comprar
            </Link>
            <Link href="/terminos" className="hover:text-white">
              Términos y condiciones
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            {/* La Res. 424/2020 exige este link destacado y de fácil acceso. */}
            <Link
              href="/arrepentimiento"
              className="rounded-md border border-[#334155] px-2.5 py-1 font-medium text-white hover:border-brand-500 hover:text-brand-500"
            >
              Botón de arrepentimiento
            </Link>
            {site.afipQrUrl && (
              <a href={site.afipQrUrl} target="_blank" rel="noreferrer" aria-label="Data Fiscal AFIP">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                  alt="Data Fiscal AFIP"
                  className="h-14 w-auto rounded"
                />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
