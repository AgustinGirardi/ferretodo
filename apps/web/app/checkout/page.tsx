"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
  Store,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  PartyPopper,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@ferretodo/ui";
import { LogoMark } from "@/components/layout/logo-mark";
import { useCart } from "@/lib/cart-store";
import { createOrder } from "./actions";
import { cartSubtotal, shippingZones } from "@/lib/cart-utils";
import { formatPrice } from "@/lib/format";
import { site, hasBankDetails, whatsappLink } from "@/lib/site";
import { EMAIL_RE } from "@/lib/validation";

type DeliveryMethod = "pickup" | "delivery";
type PaymentMethod = "mercadopago" | "transfer" | "cash";

const PHONE_DIGITS_RE = /\d/g;

function MinimalHeader() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-fg">
          <LogoMark className="h-7 w-7" />
          <span>
            FERRE<span className="text-brand-500">TODO</span>
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Lock className="h-4 w-4" /> Compra segura
        </span>
      </div>
    </header>
  );
}

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", email: "", phone: "" });
  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [zone, setZone] = useState("centro");
  const [address, setAddress] = useState({ street: "", number: "" });
  const [payment, setPayment] = useState<PaymentMethod>("mercadopago");

  useEffect(() => {
    // El efectivo solo es válido con retiro en el local: si el comprador
    // vuelve atrás y cambia a envío, se pasa a Mercado Pago automáticamente.
    setPayment((p) => (delivery === "delivery" && p === "cash" ? "mercadopago" : p));
  }, [delivery]);

  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [placedTotal, setPlacedTotal] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  // Cuando el server avisa que un precio cambió, el próximo confirm acepta el
  // total nuevo (no se vuelve a mandar expectedTotal).
  const [acceptNewPrice, setAcceptNewPrice] = useState(false);

  const subtotal = cartSubtotal(items);
  const shippingCost = delivery === "delivery" ? (shippingZones[zone]?.cost ?? 0) : 0;
  const transferDiscount = payment === "transfer" ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + shippingCost - transferDiscount;

  const step1Valid =
    data.name.trim().length >= 3 &&
    EMAIL_RE.test(data.email.trim()) &&
    (data.phone.match(PHONE_DIGITS_RE)?.length ?? 0) >= 6;
  const step2Valid = delivery === "pickup" || (address.street.trim() && address.number.trim());

  async function placeOrder() {
    setPlacing(true);
    setOrderError("");
    const res = await createOrder({
      customer: data,
      delivery: {
        method: delivery,
        zone: delivery === "delivery" ? zone : undefined,
        address: delivery === "delivery" ? `${address.street} ${address.number}`.trim() : undefined,
      },
      payment,
      items: items.map((i) => ({ productId: i.id, qty: i.qty })),
      expectedTotal: acceptNewPrice ? undefined : total,
    });
    if (res.ok && res.orderNumber) {
      setOrderNumber(res.orderNumber);
      setPlacedTotal(res.total ?? total);
      setDone(true);
      clear();
    } else {
      // Cambio de precio: se habilita aceptar el nuevo total en el siguiente confirm.
      if (res.priceChanged) setAcceptNewPrice(true);
      setOrderError(res.error ?? "No se pudo registrar el pedido. Probá de nuevo.");
    }
    setPlacing(false);
  }

  if (!mounted) {
    return (
      <>
        <MinimalHeader />
        <div className="container mx-auto px-4 py-16 text-center text-muted">Cargando…</div>
      </>
    );
  }

  if (done) {
    return (
      <>
        <MinimalHeader />
        <div className="container mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e1f5ee] text-success">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-fg">¡Gracias por tu compra!</h1>
          <p className="text-muted">
            Tu pedido <strong className="text-fg">{orderNumber}</strong> fue registrado por{" "}
            <strong className="text-fg">{formatPrice(placedTotal)}</strong>.
          </p>

          {payment === "transfer" && <TransferDetails total={placedTotal} orderNumber={orderNumber} />}

          <p className="text-sm text-muted">
            Te enviamos un email de confirmación. Te contactamos para coordinar el{" "}
            {delivery === "pickup" ? "retiro en el local" : "envío"}.
          </p>
          <Link href="/" className="mt-2">
            <Button variant="primary" size="lg">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <MinimalHeader />
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-fg">No hay nada para comprar</h1>
          <p className="text-sm text-muted">Agregá productos al carrito antes de continuar.</p>
          <Link href="/productos">
            <Button variant="primary" size="lg">
              Ver productos
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const steps = ["Tus datos", "Entrega", "Pago"];

  return (
    <>
      <MinimalHeader />
      <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div>
          <ol className="mb-6 flex items-center gap-2 text-sm">
            {steps.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const complete = step > n;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      active
                        ? "bg-brand-cta text-white"
                        : complete
                          ? "bg-success-solid text-white"
                          : "bg-surface text-muted"
                    }`}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span className={active ? "font-medium text-fg" : "text-muted"}>{label}</span>
                  {n < steps.length && <span className="mx-1 text-border">—</span>}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-bg p-5">
              <h2 className="text-lg font-bold text-fg">Tus datos</h2>
              <Field label="Nombre y apellido">
                <input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="input"
                  placeholder="Juan Pérez"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    className="input"
                    placeholder="juan@email.com"
                  />
                  {data.email.trim() && !EMAIL_RE.test(data.email.trim()) && (
                    <span className="text-xs text-danger">Ingresá un email válido (con @ y dominio).</span>
                  )}
                </Field>
                <Field label="Teléfono">
                  <input
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    className="input"
                    placeholder="0358 ..."
                  />
                  {data.phone.trim() && (data.phone.match(PHONE_DIGITS_RE)?.length ?? 0) < 6 && (
                    <span className="text-xs text-danger">Ingresá un teléfono válido (mínimo 6 números).</span>
                  )}
                </Field>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="lg" disabled={!step1Valid} onClick={() => setStep(2)}>
                  Continuar <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-bg p-5">
              <h2 className="text-lg font-bold text-fg">¿Cómo querés recibirlo?</h2>
              <div role="radiogroup" aria-label="Forma de entrega" className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  name="delivery"
                  value="pickup"
                  checked={delivery === "pickup"}
                  onSelect={() => setDelivery("pickup")}
                  icon={<Store className="h-5 w-5" />}
                  title="Retiro en el local"
                  desc="Gratis · Río Cuarto"
                />
                <OptionCard
                  name="delivery"
                  value="delivery"
                  checked={delivery === "delivery"}
                  onSelect={() => setDelivery("delivery")}
                  icon={<Truck className="h-5 w-5" />}
                  title="Envío a domicilio"
                  desc="Costo según zona"
                />
              </div>

              {delivery === "delivery" && (
                <div className="flex flex-col gap-4 rounded-lg bg-surface p-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                    <Field label="Calle">
                      <input
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="input"
                        placeholder="Av. España"
                      />
                    </Field>
                    <Field label="Número">
                      <input
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                        className="input"
                        placeholder="123"
                      />
                    </Field>
                  </div>
                  <Field label="Zona de envío">
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="input"
                    >
                      {Object.entries(shippingZones)
                        .filter(([k]) => k !== "pickup")
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label} — {formatPrice(v.cost)}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-5 w-5" /> Volver
                </Button>
                <Button variant="primary" size="lg" disabled={!step2Valid} onClick={() => setStep(3)}>
                  Continuar <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-bg p-5">
              <h2 className="text-lg font-bold text-fg">¿Cómo querés pagar?</h2>
              <div role="radiogroup" aria-label="Forma de pago" className="flex flex-col gap-3">
                <OptionCard
                  name="payment"
                  value="mercadopago"
                  checked={payment === "mercadopago"}
                  onSelect={() => setPayment("mercadopago")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Mercado Pago"
                  desc={`Tarjetas de crédito/débito y hasta ${site.installments.count} cuotas`}
                  wide
                />
                <OptionCard
                  name="payment"
                  value="transfer"
                  checked={payment === "transfer"}
                  onSelect={() => setPayment("transfer")}
                  icon={<Building2 className="h-5 w-5" />}
                  title="Transferencia bancaria"
                  desc="5% de descuento"
                  wide
                />
                {delivery === "pickup" ? (
                  <OptionCard
                    name="payment"
                    value="cash"
                    checked={payment === "cash"}
                    onSelect={() => setPayment("cash")}
                    icon={<Banknote className="h-5 w-5" />}
                    title="Efectivo"
                    desc="Al retirar en el local"
                    wide
                  />
                ) : (
                  <p className="px-1 text-xs text-muted">
                    El pago en efectivo solo está disponible si elegís retiro en el local.
                  </p>
                )}
              </div>

              {orderError && (
                <p className="rounded-md bg-[#fceaea] px-3 py-2 text-sm text-[#a32d2d]">
                  {orderError}
                </p>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" size="lg" onClick={() => setStep(2)} disabled={placing}>
                  <ArrowLeft className="h-5 w-5" /> Volver
                </Button>
                <Button variant="primary" size="lg" onClick={placeOrder} disabled={placing}>
                  {placing ? "Registrando…" : "Confirmar pedido"} <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-bg p-5 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-fg">Tu pedido</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-muted">
                  {i.qty}× {i.name}
                </span>
                <span className="shrink-0 font-medium text-fg">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-fg">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className="text-fg">
                {delivery === "pickup" ? "Gratis" : formatPrice(shippingCost)}
              </dd>
            </div>
            {transferDiscount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Descuento transferencia (5%)</dt>
                <dd>-{formatPrice(transferDiscount)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-bold text-fg">Total</span>
            <span className="text-xl font-bold text-fg">{formatPrice(total)}</span>
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            {site.name} · {site.city}
          </p>
        </aside>
      </div>
    </>
  );
}

/**
 * Datos para transferir, en la pantalla de confirmación. Sin esto el comprador
 * que elige transferencia se va sin saber a dónde mandar la plata.
 */
function TransferDetails({ total, orderNumber }: { total: number; orderNumber: string }) {
  if (!hasBankDetails()) {
    return (
      <p className="w-full rounded-lg border border-border bg-surface p-4 text-sm text-fg">
        Te contactamos con los datos para transferir. También podés pedirlos al{" "}
        <a href={`tel:${site.phone}`} className="font-medium text-brand-600 hover:underline">
          {site.phone}
        </a>
        .
      </p>
    );
  }

  const rows = [
    site.bank.alias && { label: "Alias", value: site.bank.alias, copy: true },
    site.bank.cbu && { label: "CBU", value: site.bank.cbu, copy: true },
    site.bank.holder && { label: "Titular", value: site.bank.holder, copy: false },
    site.bank.bankName && { label: "Banco", value: site.bank.bankName, copy: false },
  ].filter(Boolean) as { label: string; value: string; copy: boolean }[];

  return (
    <div className="w-full rounded-xl border border-border bg-surface p-5 text-left">
      <h2 className="text-base font-bold text-fg">Para completar tu compra, transferí</h2>
      <p className="mt-1 text-sm text-muted">
        Importe exacto: <strong className="text-fg">{formatPrice(total)}</strong>. Poné{" "}
        <strong className="text-fg">{orderNumber}</strong> como referencia.
      </p>

      <dl className="mt-4 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <dt className="w-16 shrink-0 text-muted">{r.label}</dt>
            <dd className="min-w-0 flex-1 break-all font-medium text-fg">{r.value}</dd>
            {r.copy && <CopyButton value={r.value} label={r.label} />}
          </div>
        ))}
      </dl>

      <a
        href={whatsappLink(`Hola FERRETODO, te paso el comprobante del pedido ${orderNumber}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block"
      >
        <Button variant="whatsapp" size="md" className="w-full">
          <MessageCircle className="h-4 w-4" /> Enviar comprobante por WhatsApp
        </Button>
      </a>
      <p className="mt-2 text-xs text-muted">
        Preparamos el pedido apenas confirmamos el pago.
      </p>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el valor está a la vista para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${label}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-brand-500 hover:text-brand-600"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}

/**
 * Una opción de un grupo de elección única (entrega, pago). Por dentro es un
 * <input type="radio"> real, no un <button>: eso le da gratis la navegación con
 * flechas, el anuncio "opción 2 de 3" en el lector de pantalla y el estado
 * marcado. Antes eran botones sueltos: quien no ve la pantalla no tenía forma de
 * saber que elegir uno descartaba el otro, ni cuál estaba elegido.
 */
function OptionCard({
  name,
  value,
  checked,
  onSelect,
  icon,
  title,
  desc,
  wide,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  wide?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 ${
        checked ? "border-brand-500 bg-brand-50" : "border-border hover:bg-surface"
      } ${wide ? "w-full" : ""}`}
    >
      {/* El control nativo se oculta a la vista pero sigue existiendo para el
          teclado y el lector de pantalla; el anillo de foco lo dibuja el label. */}
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className={checked ? "text-brand-600" : "text-muted"}>{icon}</span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-fg">{title}</span>
        <span className="text-xs text-muted">{desc}</span>
      </span>
      <span
        aria-hidden="true"
        className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full border ${
          checked ? "border-brand-500 bg-brand-cta text-white" : "border-border"
        }`}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
    </label>
  );
}
