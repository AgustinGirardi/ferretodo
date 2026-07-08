import { Truck, CreditCard, Store, Headphones } from "lucide-react";
import { getHomeSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/reveal";

const icons = [Truck, CreditCard, Store, Headphones];

export async function BenefitsBar() {
  const s = await getHomeSettings();
  const benefits = [
    { title: s.benefit1Title, text: s.benefit1Text },
    { title: s.benefit2Title, text: s.benefit2Text },
    { title: s.benefit3Title, text: s.benefit3Text },
    { title: s.benefit4Title, text: s.benefit4Text },
  ];

  return (
    <section className="border-y border-border bg-bg">
      <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
        {benefits.map((b, i) => {
          const Icon = icons[i] ?? Truck;
          if (!b.title && !b.text) return null;
          return (
            <Reveal key={i} delay={i * 60}>
              <div className="group flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform duration-200 motion-safe:group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{b.title}</p>
                  <p className="truncate text-xs text-muted">{b.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
