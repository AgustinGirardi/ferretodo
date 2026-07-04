import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de compra en la tienda online de FERRETODO.",
};

const h2 = "mt-8 text-lg font-semibold text-fg";
const p = "mt-2 text-sm leading-relaxed text-muted";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">Términos y condiciones</h1>
      <p className={p}>
        Estos términos regulan la compra de productos en la tienda online de {site.name} (
        {site.tagline}), con local en {site.address}. Al realizar un pedido aceptás estas
        condiciones.
      </p>

      <h2 className={h2}>Precios y stock</h2>
      <p className={p}>
        Los precios están expresados en pesos argentinos e incluyen IVA. Pueden modificarse sin
        previo aviso; el precio válido es el vigente al momento de confirmar el pedido. Las ofertas
        rigen hasta agotar stock. Si por error un producto se publicara con un precio
        manifiestamente incorrecto o sin stock real, te contactaremos para ofrecerte la anulación
        sin costo o una alternativa.
      </p>

      <h2 className={h2}>Medios de pago</h2>
      <p className={p}>
        Aceptamos Mercado Pago (tarjetas de crédito y débito), transferencia bancaria (con
        descuento) y efectivo en el local. El pedido se prepara una vez acreditado el pago, salvo
        pago en efectivo al retirar.
      </p>

      <h2 className={h2}>Envíos y retiro</h2>
      <p className={p}>
        Podés retirar sin cargo en nuestro local ({site.address}) o solicitar envío a domicilio
        dentro de {site.city} y alrededores, con costo según la zona indicada en el checkout. Los
        tiempos de entrega se coordinan por teléfono o WhatsApp una vez confirmado el pedido.
      </p>

      <h2 className={h2}>Derecho de arrepentimiento</h2>
      <p className={p}>
        Tenés derecho a revocar tu compra online dentro de los 10 días corridos desde la recepción
        del producto, sin costo y con devolución total del dinero (art. 34, Ley 24.240 y Res.
        424/2020). Usá el{" "}
        <Link href="/arrepentimiento" className="text-brand-600 underline hover:text-brand-500">
          botón de arrepentimiento
        </Link>{" "}
        para iniciar el trámite. El producto debe estar sin uso y en su embalaje original.
      </p>

      <h2 className={h2}>Garantías</h2>
      <p className={p}>
        Todos los productos nuevos cuentan con la garantía legal de 6 meses (art. 11, Ley 24.240),
        sin perjuicio de la garantía del fabricante cuando sea mayor. Para hacer valer la garantía
        presentá tu comprobante de compra en el local o contactanos.
      </p>

      <h2 className={h2}>Defensa del consumidor</h2>
      <p className={p}>
        Ante cualquier reclamo podés comunicarte con nosotros al {site.phone}. Además tenés a tu
        disposición la Dirección de Defensa del Consumidor de tu jurisdicción y la ventanilla única
        federal de reclamos en{" "}
        <a
          href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 underline hover:text-brand-500"
        >
          argentina.gob.ar/produccion/defensadelconsumidor
        </a>
        .
      </p>

      <h2 className={h2}>Jurisdicción</h2>
      <p className={p}>
        Para cualquier controversia serán competentes los tribunales ordinarios de la ciudad de{" "}
        {site.city}, Córdoba, sin perjuicio de los derechos que la normativa de defensa del
        consumidor te reconoce.
      </p>
    </div>
  );
}
