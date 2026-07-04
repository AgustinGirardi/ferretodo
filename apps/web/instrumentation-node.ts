// Arranque del servidor en producción (runtime Node): crea el admin inicial
// si la base está vacía y programa el backup diario automático.

import { runBackup } from "./lib/backup";
import { ensureAdminUser } from "./lib/bootstrap";

void (async () => {
  await ensureAdminUser().catch((e) => console.error("[bootstrap] falló:", e));

  const run = () =>
    runBackup()
      .then((file) => console.log(`[backup] copia automática creada: ${file}`))
      .catch((e) => console.error("[backup] falló la copia automática:", e));

  // Primera copia a los 5 minutos de arrancar, después una por día.
  setTimeout(run, 5 * 60_000);
  setInterval(run, 24 * 60 * 60 * 1000);
})();
