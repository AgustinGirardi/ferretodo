# Guía de desarrollo — FERRETODO

## Requisitos

- Node.js ≥ 20 (probado con 22 y 24)
- pnpm 10 (`corepack enable`)

No hace falta Docker ni ningún servicio externo: la base es SQLite, un archivo local.

## Puesta en marcha (primera vez)

```bash
# 1. Dependencias del monorepo
pnpm install

# 2. Variables de entorno
cp apps/web/.env.example apps/web/.env
#    Completar AUTH_SECRET con 32+ caracteres aleatorios. El resto es opcional:
#    sin RESEND_API_KEY los emails se simulan en consola y la compra funciona igual.

# 3. Crear la base y cargar datos de demostración
pnpm db:migrate
pnpm db:seed

# 4. Levantar la app
pnpm dev
```

- **Tienda:** http://localhost:3000
- **Panel admin:** http://localhost:3000/admin

Las credenciales del admin de desarrollo se definen en `apps/web/prisma/seed.ts` y sirven
**solo en local**. En producción no existe usuario por defecto: el admin inicial se crea en el
primer arranque a partir de `ADMIN_EMAIL` y `ADMIN_PASSWORD` (ver `apps/web/lib/bootstrap.ts`).

## Estructura

```
apps/web/            Next.js 15: tienda, panel admin y lógica de negocio
  app/(shop)/        Rutas públicas
  app/admin/         Panel (rutas y server actions)
  app/api/           Route handlers
  components/        Componentes de UI
  lib/               Auth, sesiones, backups, rate limiting, emails, uploads
  prisma/            Schema, migraciones, seed y simulador de datos
packages/ui/         Design system compartido
packages/config/     Presets de Tailwind y TypeScript
docs/                Blueprint inicial (histórico, ver nota en el README)
```

## Scripts útiles (desde la raíz)

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta la app en modo watch |
| `pnpm build` | Build de producción (Turbo) |
| `pnpm typecheck` | `tsc --noEmit` sobre el monorepo |
| `pnpm test` | Tests |
| `pnpm db:migrate` | Crea y aplica una migración de desarrollo |
| `pnpm db:seed` | Recarga el catálogo de demostración |
| `pnpm db:studio` | Prisma Studio para explorar la base |

## Convenciones

- **Autorización:** toda server action y todo route handler del panel resuelve su propia sesión
  con `getAdminSession()`. No delegar la protección al middleware: las server actions son
  endpoints POST invocables directamente.
- **Secretos:** nunca en el repo. Van en `apps/web/.env` (ignorado por git) y, en producción,
  en las variables de entorno de Render.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`…).
- **Ramas:** `feat/<área>-<descripción>`, PR a `main` con la CI en verde.

## Nota sobre carpetas sincronizadas en la nube

Si clonás el repo dentro de OneDrive, Dropbox o similar, excluí `node_modules` y `.next` de la
sincronización. De lo contrario aparecen copias de conflicto y errores `EPERM`/`EINVAL` sobre
`.next` o el motor de Prisma durante los builds. Lo más simple es clonar fuera de esas carpetas.
