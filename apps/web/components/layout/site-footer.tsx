import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import { site } from "@/lib/site";
import { getCategories } from "@/lib/products";

export async function SiteFooter() {
  const categories = await getCategories();
  return (
    <footer className="bg-[#0f172a] text-[#cbd5e1]">
      <div className="container mx-auto grid gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-xl font-bold text-white">
            FERRE<span className="text-brand-500">TODO</span>
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

        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Novedades y ofertas</h3>
          <p className="mb-3 text-sm text-[#94a3b8]">Suscribite y enterate de las promos.</p>
          <form className="flex overflow-hidden rounded-md border border-[#334155]">
            <span className="flex items-center pl-3 text-[#94a3b8]">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="Tu email"
              aria-label="Tu email"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#64748b]"
            />
            <button
              type="submit"
              className="bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              Sumarme
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#1e293b]">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#64748b] sm:flex-row">
          <span>© {new Date().getFullYear()} FERRETODO · Todos los derechos reservados</span>
          <div className="flex gap-4">
            <Link href="/ayuda" className="hover:text-white">
              Cómo comprar
            </Link>
            <Link href="/arrepentimiento" className="hover:text-white">
              Botón de arrepentimiento
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
