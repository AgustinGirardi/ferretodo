import type { Metadata } from "next";
import { site } from "@/lib/site";
import { WithdrawalForm } from "@/components/legal/withdrawal-form";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description:
    "Ejercé tu derecho de arrepentimiento: revocá tu compra dentro de los 10 días corridos (Ley 24.240, Res. 424/2020).",
};

export default function WithdrawalPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">Botón de arrepentimiento</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Si compraste en nuestra tienda online, tenés derecho a arrepentirte y revocar la compra
        dentro de los <strong className="text-fg">10 días corridos</strong> desde que recibiste el
        producto, sin costo alguno y con la devolución total del dinero (art. 34 de la Ley 24.240
        de Defensa del Consumidor y Resolución 424/2020). El producto debe estar sin uso y en su
        embalaje original.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Completá el formulario y te vamos a responder dentro de las 24 horas hábiles con los pasos
        para la devolución. También podés hacerlo por teléfono al {site.phone} o en el local (
        {site.address}).
      </p>

      <div className="mt-8">
        <WithdrawalForm />
      </div>
    </div>
  );
}
