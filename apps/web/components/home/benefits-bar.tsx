import { Truck, CreditCard, Store, Headphones } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Envíos en Río Cuarto", text: "Costo por zona, rápido y seguro" },
  { icon: CreditCard, title: "Hasta 12 cuotas", text: "Con tarjeta o Mercado Pago" },
  { icon: Store, title: "Retiro en el local", text: "Comprá online, retirá hoy" },
  { icon: Headphones, title: "Atención profesional", text: "Te asesoramos por WhatsApp" },
];

export function BenefitsBar() {
  return (
    <section className="border-y border-border bg-bg">
      <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{b.title}</p>
                <p className="truncate text-xs text-muted">{b.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
