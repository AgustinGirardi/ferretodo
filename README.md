# 🔧 FERRETODO — Plataforma de E-commerce para Ferretería y Corralón

> La plataforma de e-commerce de ferretería más completa de Argentina.
> B2C + B2B, pensada para vender más, generar confianza y crecer durante 10 años.

**Negocio:** FERRETODO - Ferretería y Corralón
**Ubicación:** Av. Ejemplo 1234, Córdoba, Argentina, Argentina
**Teléfono:** 0351-000-0000
**Horario:** Lun a Vie 08:00–12:00 y 15:30–19:30 · Sáb 08:30–13:00 · Dom cerrado
**Entrega:** a domicilio y retiro en local.

---

## 📚 Documentación

Todo el blueprint del proyecto vive en [`/docs`](./docs):

| Archivo | Contenido |
|---|---|
| [00-PRD.md](./docs/00-PRD.md) | Requisitos del producto: visión, usuarios, métricas, alcance por fase |
| [01-ARCHITECTURE.md](./docs/01-ARCHITECTURE.md) | Arquitectura del sistema, decisiones técnicas (ADRs), patrones |
| [02-DATABASE.md](./docs/02-DATABASE.md) | Modelo entidad-relación, esquema Prisma, índices |
| [03-BACKEND.md](./docs/03-BACKEND.md) | Módulos NestJS, API REST, autenticación, seguridad |
| [04-FRONTEND.md](./docs/04-FRONTEND.md) | Rutas, componentes, estado, data fetching, performance |
| [05-DESIGN-SYSTEM.md](./docs/05-DESIGN-SYSTEM.md) | Tokens, colores, tipografía, componentes, UX/UI, wireframes |
| [06-ROADMAP.md](./docs/06-ROADMAP.md) | Fases MVP → V1 → V2 → V3, criterios de salida |
| [07-TASKS.md](./docs/07-TASKS.md) | Backlog accionable, tarea por tarea |
| [08-SECURITY.md](./docs/08-SECURITY.md) | Amenazas, mitigaciones, backups, accesibilidad, cumplimiento |

---

## 🏗️ Stack tecnológico

**Frontend:** Next.js 15 (App Router) · React · TypeScript · TailwindCSS · shadcn/ui · Framer Motion
**Backend:** NestJS · Node.js · TypeScript
**Base de datos:** PostgreSQL · Prisma ORM
**Cache / colas:** Redis · BullMQ
**Búsqueda:** Postgres FTS (MVP) → Meilisearch (V1) → embeddings semánticos (V2)
**Auth:** JWT + Refresh Tokens · OAuth preparado · 2FA admin
**Storage:** Cloudinary (abstracción `StorageProvider` para migrar a S3)
**Emails:** Resend
**Pagos:** Mercado Pago (cuotas) · Transferencia · Efectivo/retiro · (Stripe/PayPal preparados)
**Deploy:** Docker · Vercel (front) · Railway (back + Postgres + Redis)
**CI/CD:** GitHub Actions

---

## 📦 Estructura del monorepo (objetivo)

```
ferretodo/
├── apps/
│   ├── web/          # Next.js (tienda + panel admin)
│   └── api/          # NestJS (API REST modular)
├── packages/
│   ├── ui/           # Design system (shadcn + componentes propios)
│   ├── types/        # Tipos/DTOs compartidos front ↔ back
│   ├── config/       # ESLint, TS, Tailwind compartidos
│   └── db/           # Prisma schema, migraciones, seed
├── docs/             # 📚 esta documentación
├── docker-compose.yml
└── turbo.json
```

---

## 🎯 Filosofía del proyecto

1. **Vender más, no impresionar.** Cada feature se mide contra: ¿vende más, da confianza o ahorra trabajo al mostrador?
2. **Argentina-first.** Mercado Pago con cuotas, WhatsApp como canal de venta, facturación AFIP, manejo de inflación.
3. **B2B es el corazón.** Contratistas con listas de precios y cuenta corriente = ingreso recurrente.
4. **Monolito modular, no microservicios.** Clean Architecture y DDD-light sin sobre-ingeniería.
5. **Mobile-first.** La mayoría de los clientes entran desde el celular.

---

## 🚦 Estado

📄 **Fase actual: Documentación / Blueprint** — pendiente de aprobación antes de iniciar desarrollo.

Ver [06-ROADMAP.md](./docs/06-ROADMAP.md) para el plan completo de ejecución.
