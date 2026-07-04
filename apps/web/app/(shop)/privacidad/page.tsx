import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales en la tienda online de FERRETODO.",
};

const h2 = "mt-8 text-lg font-semibold text-fg";
const p = "mt-2 text-sm leading-relaxed text-muted";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">Política de privacidad</h1>
      <p className={p}>
        En {site.name} tratamos tus datos personales conforme a la Ley 25.326 de Protección de
        Datos Personales de la República Argentina.
      </p>

      <h2 className={h2}>Qué datos recopilamos</h2>
      <p className={p}>
        Cuando hacés un pedido te pedimos nombre, email, teléfono y, si elegís envío, tu dirección.
        No almacenamos datos de tarjetas: los pagos se procesan en las plataformas de los medios de
        pago. El carrito de compras se guarda únicamente en tu navegador.
      </p>

      <h2 className={h2}>Para qué los usamos</h2>
      <p className={p}>
        Usamos tus datos exclusivamente para procesar y entregar tu pedido, emitir comprobantes,
        contactarte por tu compra y responder tus consultas. No vendemos ni cedemos tus datos a
        terceros, salvo obligación legal.
      </p>

      <h2 className={h2}>Tus derechos</h2>
      <p className={p}>
        Podés solicitar el acceso, la rectificación o la eliminación de tus datos escribiéndonos o
        llamando al {site.phone}. La Agencia de Acceso a la Información Pública, órgano de control
        de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se
        interpongan con relación al incumplimiento de las normas sobre protección de datos
        personales.
      </p>
    </div>
  );
}
