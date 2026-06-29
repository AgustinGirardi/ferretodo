import Link from "next/link";
import { CreditCard, Store, Truck, MessageCircle, Wrench } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { whatsappLink } from "@/lib/site";

const trustBadges = [
  { icon: CreditCard, label: "12 cuotas sin interés", className: "bg-[#e6f1fb] text-[#0c447c]" },
  { icon: Store, label: "Retiro hoy en el local", className: "bg-[#e1f5ee] text-[#085041]" },
  { icon: Truck, label: "Envío por zona", className: "bg-[#faeeda] text-[#633806]" },
];

export function Hero() {
  return (
    <section className="bg-orange-50">
      <div className="container mx-auto grid items-center gap-6 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:py-14">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl">
            Herramientas y materiales
            <br />
            para tu obra y tu casa
          </h1>
          <p className="mt-3 max-w-md text-base text-muted">
            Miles de productos de las mejores marcas, con stock real, envío en Río Cuarto y
            atención de profesionales.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {trustBadges.map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${b.className}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {b.label}
                </span>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ofertas">
              <Button variant="primary" size="lg">
                Ver ofertas
              </Button>
            </Link>
            <a
              href={whatsappLink("Hola FERRETODO, quería hacer una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="whatsapp" size="lg">
                <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-[#ffe7d4]">
          <Wrench className="h-28 w-28 text-[#f0997b]" strokeWidth={1} />
        </div>
      </div>
    </section>
  );
}
