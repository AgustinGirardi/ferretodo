# Guía de desarrollo — FERRETODO

## Requisitos

- Node.js ≥ 20 (probado con 24)
- pnpm 10 (`corepack enable`)
- Docker (para Postgres + Redis locales)

## Puesta en marcha (primera vez)

```bash
# 1. Instalar dependencias del monorepo
pnpm install

# 2. Variables de entorno
cp .env.example .env        # y completar lo necesario

# 3. Levantar Postgres + Redis + Mailhog
pnpm docker:up

# 4. Generar cliente Prisma + migrar + seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Levantar todo (web + api) en paralelo
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1 · Docs: http://localhost:4000/api/docs
- Mailhog (emails de dev): http://localhost:8025

## Estructura

```
apps/web     Next.js (tienda + panel admin)
apps/api     NestJS (API REST modular)
packages/db  Prisma (schema, migraciones, seed)
packages/ui  Design system
packages/types   Tipos compartidos front ↔ back
packages/config  Presets (Tailwind, TS)
```

## Scripts útiles (raíz)

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta web + api en watch |
| `pnpm build` | Build de todo el monorepo (Turbo) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Calidad |
| `pnpm db:studio` | Prisma Studio (explorar la DB) |
| `pnpm db:migrate` | Crear/aplicar migración de desarrollo |

## ⚠️ Nota sobre OneDrive

El repo está dentro de una carpeta sincronizada por OneDrive. `node_modules` está en
`.gitignore`, pero conviene **excluir `node_modules` de la sincronización de OneDrive**
(clic derecho → "Liberar espacio" / o configurar exclusión) para evitar lentitud y
bloqueos de archivos durante `pnpm install` y los builds.

## Convenciones

- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Ramas: `feat/<área>-<desc>`, PR a `main` con CI en verde.
- Documentación viva en [`/docs`](./docs). Las tareas, en [`docs/07-TASKS.md`](./docs/07-TASKS.md).
