export const ORDER_STATUSES = [
  { value: "PENDING", label: "Nuevo", className: "bg-[#e6f1fb] text-[#0c447c]" },
  { value: "PREPARING", label: "En preparación", className: "bg-[#faeeda] text-[#633806]" },
  { value: "READY", label: "Listo para entregar", className: "bg-[#eef2ff] text-[#3730a3]" },
  { value: "DELIVERED", label: "Entregado", className: "bg-[#e1f5ee] text-[#085041]" },
  { value: "CANCELLED", label: "Cancelado", className: "bg-[#fceaea] text-[#a32d2d]" },
] as const;

export function orderStatus(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value) ?? ORDER_STATUSES[0];
}

export const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Retiro en el local",
  delivery: "Envío a domicilio",
};

export const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  transfer: "Transferencia (-5%)",
  cash: "Efectivo",
};
