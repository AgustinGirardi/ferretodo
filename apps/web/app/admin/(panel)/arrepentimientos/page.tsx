import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { setWithdrawalStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Arrepentimientos</h1>
      <p className="mb-6 text-sm text-muted">
        Solicitudes del botón de arrepentimiento (devoluciones por Ley 24.240).{" "}
        {pending > 0 ? `${pending} sin resolver.` : "Todo al día."}
      </p>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="h-10 w-10 text-muted" />
          <p className="text-sm font-medium text-fg">No hay solicitudes</p>
          <p className="max-w-xs text-sm text-muted">
            Cuando un cliente use el botón de arrepentimiento, vas a ver su solicitud acá.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Constancia</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Motivo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const resolved = r.status === "RESOLVED";
                return (
                  <tr key={r.id} className="border-b border-border align-top last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <span className="font-medium text-fg">{r.code}</span>
                      <span className="block text-xs text-muted">
                        {new Date(r.createdAt).toLocaleDateString("es-AR")}
                        {r.orderNumber ? ` · Pedido ${r.orderNumber}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="block text-fg">{r.name}</span>
                      <span className="block text-xs">{r.email}</span>
                      {r.phone && <span className="block text-xs">{r.phone}</span>}
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-muted md:table-cell">
                      <span className="line-clamp-3">{r.reason || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          resolved ? "bg-[#e1f5ee] text-[#085041]" : "bg-[#faeeda] text-[#633806]"
                        }`}
                      >
                        {resolved ? "Resuelta" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={setWithdrawalStatus.bind(null, r.id, resolved ? "PENDING" : "RESOLVED")}>
                        <button
                          type="submit"
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-brand-500 hover:text-brand-500"
                        >
                          {resolved ? "Reabrir" : "Marcar resuelta"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
