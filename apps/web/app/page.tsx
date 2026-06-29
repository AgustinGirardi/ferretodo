import { Button } from "@ferretodo/ui";

export default function HomePage() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-8 py-16 text-center">
      <span className="rounded-full bg-brand-50 px-4 py-1 text-sm font-medium text-brand-600">
        Fase 0 · Fundaciones
      </span>

      <h1 className="text-4xl font-bold sm:text-5xl">
        FERRE<span className="text-brand-500">TODO</span>
      </h1>

      <p className="max-w-xl text-lg text-muted">
        Ferretería y Corralón en Río Cuarto, Córdoba. La plataforma está en construcción —
        el diseño definitivo de la home se aplica una vez elegida la propuesta visual.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="lg">
          Ver catálogo
        </Button>
        <Button variant="whatsapp" size="lg">
          Consultar por WhatsApp
        </Button>
      </div>

      <p className="text-sm text-muted">
        Lun a Vie 08:00–12:00 y 15:30–19:30 · Sáb 08:30–13:00 · Tel 0351-000-0000
      </p>
    </main>
  );
}
