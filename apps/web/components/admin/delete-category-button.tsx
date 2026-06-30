"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/app/admin/(panel)/categorias/actions";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.ok) {
        setError(res.error ?? "No se pudo eliminar");
        setConfirming(false);
      }
    });
  }

  if (error) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-warning">{error}</span>
        <button onClick={() => setError("")} className="text-xs text-muted hover:text-fg">
          Cerrar
        </button>
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-muted">¿Seguro?</span>
        <button
          onClick={onDelete}
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
