-- Contador para invalidar las sesiones abiertas de un cliente (ver
-- lib/session-version.ts). Se agrega como columna nueva en vez de recrear la
-- tabla: Order tiene una clave foránea contra Customer y el DROP/RENAME que
-- genera Prisma por defecto es innecesariamente riesgoso sobre datos vivos.
ALTER TABLE "Customer" ADD COLUMN "sessionEpoch" INTEGER NOT NULL DEFAULT 0;
