"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBrand } from "@/app/admin/(panel)/marcas/actions";

export function DeleteBrandButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-muted">¿Seguro?</span>
        <button
          onClick={() => startTransition(() => deleteBrand(id))}
          disabled={pending}
          className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          {pending ? "..." : "Sí"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-border px-2 py-1 text-xs text-fg hover:bg-surface"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={`Eliminar ${name}`}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
