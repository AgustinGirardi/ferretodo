import { getHomeSettings } from "@/lib/settings";
import { PortadaForm } from "@/components/admin/portada-form";

export const dynamic = "force-dynamic";

export default async function AdminPortadaPage() {
  const settings = await getHomeSettings();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Portada</h1>
      <p className="mb-6 text-sm text-muted">
        Editá el banner y los textos de la página de inicio. Los cambios se ven al instante.
      </p>
      <PortadaForm initial={settings} />
    </div>
  );
}
