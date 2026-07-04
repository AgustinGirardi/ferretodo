import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description: "Guía paso a paso para comprar en la tienda online de FERRETODO.",
};

const h2 = "mt-8 text-lg font-semibold text-fg";
const p = "mt-2 text-sm leading-relaxed text-muted";

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">Cómo comprar</h1>

      <h2 className={h2}>1. Elegí tus productos</h2>
      <p className={p}>
        Buscá por nombre o navegá por categorías. En cada producto vas a ver el precio, las cuotas
        y si hay stock. Tocá “Agregar al carrito” con la cantidad que necesites.
      </p>

      <h2 className={h2}>2. Revisá el carrito</h2>
      <p className={p}>
        Desde el ícono del carrito podés ajustar cantidades o quitar productos. Si preferís un
        presupuesto, podés enviarnos el detalle por WhatsApp con un clic.
      </p>

      <h2 className={h2}>3. Completá el checkout</h2>
      <p className={p}>
        Ingresá tus datos, elegí <strong className="text-fg">retiro gratis en el local</strong> (
        {site.address}) o envío a domicilio por zona, y la forma de pago: Mercado Pago,
        transferencia (con 5% de descuento) o efectivo al retirar.
      </p>

      <h2 className={h2}>4. Confirmación y entrega</h2>
      <p className={p}>
        Al confirmar vas a recibir un número de pedido y un email con el detalle. Te contactamos a
        la brevedad para coordinar el retiro o la entrega.
      </p>

      <h2 className={h2}>¿Dudas?</h2>
      <p className={p}>
        Escribinos por{" "}
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 underline hover:text-brand-500"
        >
          WhatsApp
        </a>{" "}
        o llamanos al {site.phone} ({site.hours[0].days}: {site.hours[0].time}). También podés ver
        nuestros{" "}
        <Link href="/terminos" className="text-brand-600 underline hover:text-brand-500">
          términos y condiciones
        </Link>
        .
      </p>
    </div>
  );
}
