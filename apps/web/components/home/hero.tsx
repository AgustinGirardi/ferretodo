import Link from "next/link";
import Image from "next/image";
import { CreditCard, Store, Truck, MessageCircle, Wrench } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { whatsappLink } from "@/lib/site";
import { getHomeSettings } from "@/lib/settings";

const trustBadges = [
  { icon: CreditCard, label: "12 cuotas sin interés", className: "bg-[#e6f1fb] text-[#0c447c]" },
  { icon: Store, label: "Retiro hoy en el local", className: "bg-[#e1f5ee] text-[#085041]" },
  { icon: Truck, label: "Envío por zona", className: "bg-[#faeeda] text-[#633806]" },
];

export async function Hero() {
  const s = await getHomeSettings();

  return (
    <section className="bg-orange-50 dark:bg-surface">
      <div className="container mx-auto grid items-center gap-6 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:py-14">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl">{s.heroTitle}</h1>
          <p className="mt-3 max-w-md text-base text-muted">{s.heroSubtitle}</p>

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
            <Link href={s.heroCtaLink || "/productos"}>
              <Button variant="primary" size="lg">
                {s.heroCtaLabel || "Ver ofertas"}
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

        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#ffe7d4]">
          {s.heroImageUrl ? (
            <Image
              src={s.heroImageUrl}
              alt="Banner de la tienda"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          ) : (
            <Wrench className="h-28 w-28 text-[#f0997b]" strokeWidth={1} />
          )}
        </div>
      </div>
    </section>
  );
}
