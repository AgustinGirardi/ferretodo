-- Verificación del email de las cuentas de cliente.
-- Columna nueva y opcional: las cuentas que ya existen quedan en NULL (sin
-- verificar) y pueden verificarse desde "Mi cuenta" sin perder nada.
ALTER TABLE "Customer" ADD COLUMN "emailVerifiedAt" DATETIME;
