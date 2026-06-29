# 01 · ARCHITECTURE — Arquitectura del Sistema

**Proyecto:** FERRETODO
**Versión:** 1.0 (Blueprint)
**Estado:** Pendiente de aprobación

---

## 1. Principios rectores

| Principio | Cómo se aplica |
|---|---|
| **Clean Architecture** | Dominio independiente de framework, DB y UI. Casos de uso en el centro. |
| **DDD-light** | Límites de contexto claros (catálogo, pedidos, clientes, pricing…) sin la ceremonia completa de DDD. |
| **SOLID / DRY / KISS** | Inversión de dependencias vía interfaces; nada se repite; la solución más simple que funcione. |
| **Repository Pattern** | Acceso a datos detrás de interfaces; Prisma es un detalle de implementación. |
| **Service Layer** | Lógica de negocio en servicios/casos de uso, no en controladores. |
| **Modular Monolith** | Un despliegue, módulos aislados. Microservicios solo si y cuando el volumen lo justifique. |
| **API-first** | REST documentada (OpenAPI), lista para GraphQL y para app móvil sin reescribir el backend. |

---

## 2. Vista de alto nivel

```
                         ┌─────────────────────────────────────────┐
                         │              CLIENTES                     │
                         │  Navegador (web/móvil)  ·  App futura     │
                         │  WhatsApp  ·  Bots/Crawlers (SEO)         │
                         └───────────────┬───────────────────────────┘
                                         │ HTTPS
                         ┌───────────────▼───────────────┐
                         │     Next.js (apps/web)         │   Vercel
                         │  Tienda (SSR/ISR) + Panel Admin│
                         │  Server Actions / Route Handlers│
                         └───────────────┬───────────────┘
                                         │ REST (JSON) + JWT
                         ┌───────────────▼───────────────┐
                         │      NestJS API (apps/api)     │   Railway
                         │  Módulos de dominio (DDD-light)│
                         │  Auth · Catálogo · Pedidos ··· │
                         └───┬───────┬───────┬─────────┬──┘
                             │       │       │         │
                  ┌──────────▼┐ ┌────▼────┐ ┌▼───────┐ ┌▼──────────┐
                  │PostgreSQL │ │  Redis  │ │Cloud-  │ │ Servicios │
                  │ (Prisma)  │ │cache+   │ │inary   │ │ externos  │
                  │           │ │BullMQ   │ │(imgs)  │ │ MP·Resend │
                  └───────────┘ └─────────┘ └────────┘ └───────────┘
```

### ¿Por qué Next.js consume una API NestJS separada y no usa solo su backend?

Decisión deliberada (ver ADR-001). El backend NestJS es **la única fuente de verdad de negocio**, reutilizable por: la web, la futura app móvil (Expo), integraciones (ERP/CRM) y un futuro GraphQL gateway. Next.js queda como capa de presentación + BFF ligero (orquesta llamadas, SSR/ISR, SEO).

---

## 3. Estructura del monorepo

```
ferretodo/
├── apps/
│   ├── web/                      # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── (shop)/           # tienda pública
│   │   │   ├── (account)/        # área de cliente
│   │   │   ├── admin/            # panel administrador
│   │   │   └── api/              # route handlers / BFF
│   │   ├── components/
│   │   └── lib/
│   └── api/                      # NestJS
│       └── src/
│           ├── modules/          # un módulo por bounded context
│           │   ├── auth/
│           │   ├── users/
│           │   ├── catalog/      # productos, categorías, marcas
│           │   ├── inventory/    # stock, movimientos, sucursales
│           │   ├── pricing/      # listas de precios, descuentos
│           │   ├── cart/
│           │   ├── orders/
│           │   ├── quotes/       # presupuestos
│           │   ├── payments/
│           │   ├── shipping/
│           │   ├── customers/    # B2B, cuenta corriente
│           │   ├── marketing/    # cupones, promos, banners
│           │   ├── reviews/
│           │   ├── search/
│           │   ├── notifications/# email, whatsapp, push
│           │   ├── analytics/
│           │   ├── audit/
│           │   └── admin/
│           ├── shared/           # kernel: errores, result, base classes
│           ├── infra/            # prisma, redis, storage, providers
│           └── main.ts
├── packages/
│   ├── ui/                       # design system (shadcn + propios)
│   ├── types/                    # DTOs/contratos compartidos
│   ├── config/                   # eslint, tsconfig, tailwind preset
│   └── db/                       # prisma schema + migrations + seed
├── docs/
├── docker-compose.yml            # postgres + redis + mailhog (dev)
├── turbo.json
└── pnpm-workspace.yaml
```

### Anatomía de un módulo (Clean Architecture)

Cada módulo de dominio sigue las mismas capas:

```
modules/catalog/
├── domain/
│   ├── entities/        product.entity.ts        # reglas de negocio puras
│   ├── value-objects/   sku.vo.ts, money.vo.ts
│   └── repositories/    product.repository.ts    # INTERFAZ (puerto)
├── application/
│   ├── use-cases/       create-product.use-case.ts
│   └── dto/             create-product.dto.ts
├── infrastructure/
│   └── prisma-product.repository.ts              # implementación (adaptador)
└── presentation/
    └── product.controller.ts                     # HTTP, validación, auth
```

**Regla de dependencias:** `presentation → application → domain ← infrastructure`. El dominio no importa nada de fuera. La infraestructura implementa interfaces del dominio. Esto permite testear casos de uso sin DB.

---

## 4. Decisiones de arquitectura (ADRs)

### ADR-001 — Backend NestJS separado del frontend Next.js
**Decisión:** API NestJS independiente como única fuente de verdad de negocio.
**Por qué:** reutilización por web + móvil + integraciones; separación de responsabilidades; despliegues independientes.
**Trade-off:** dos despliegues y latencia de red interna. Aceptable; se mitiga con cache y colocación regional.

### ADR-002 — Monolito modular, NO microservicios
**Decisión:** un solo backend con módulos aislados por bounded context.
**Por qué:** una ferretería (incluso multi-sucursal) no genera el volumen que justifique el costo operativo de microservicios. El aislamiento por módulo permite extraer servicios después si hace falta.
**Trade-off:** disciplina de equipo para no acoplar módulos. Se controla con linting de fronteras de import.

### ADR-003 — PostgreSQL + Prisma
**Decisión:** Postgres como DB primaria, Prisma como ORM.
**Por qué:** datos relacionales (productos, pedidos, precios), transacciones ACID (stock, cuenta corriente), FTS y `pg_trgm` integrados, JSONB para especificaciones flexibles. Prisma da type-safety end-to-end.
**Trade-off:** Prisma abstrae queries complejas; para reportes pesados usamos SQL crudo vía `$queryRaw`.

### ADR-004 — Búsqueda evolutiva en 3 etapas
**Decisión:** FTS de Postgres (MVP) → Meilisearch (V1) → embeddings semánticos (V2).
**Por qué:** no construir IA de búsqueda antes de tener catálogo. FTS + `pg_trgm` ya da typo-tolerance y sinónimos básicos sin infra extra.
**Trade-off:** migración futura del índice. Se aísla detrás de `SearchService` (puerto), así el cambio no toca el resto.

### ADR-005 — Cloudinary para imágenes (S3 preparado)
**Decisión:** Cloudinary como storage/CDN de medios en MVP.
**Por qué:** optimización, miniaturas, recorte y formato automáticos sin código. Detrás de interfaz `StorageProvider`.
**Trade-off:** costo a escala; mitigable migrando a S3 + transformaciones propias sin tocar el dominio.

### ADR-006 — Redis para cache + colas (BullMQ)
**Decisión:** Redis para cache de catálogo/sesiones y BullMQ para jobs (emails, PDFs, indexación, import CSV, recálculo de precios).
**Por qué:** desacopla tareas lentas del request; resiliencia y reintentos.

### ADR-007 — Pagos detrás de `PaymentProvider`
**Decisión:** abstracción de pasarela; Mercado Pago como primera implementación.
**Por qué:** Stripe/PayPal/MODO "preparados" significa una interfaz común + adaptadores, sin reescribir checkout.

### ADR-008 — Pricing como módulo de dominio propio
**Decisión:** el cálculo de precios (lista por tipo de cliente, descuentos, IVA, promos) vive en un módulo `pricing` independiente.
**Por qué:** es la lógica de mayor valor y mayor riesgo de bug en B2B. Centralizarla evita inconsistencias entre catálogo, carrito y presupuestos.

### ADR-009 — Multi-sucursal modelado desde el día uno
**Decisión:** el stock se modela por sucursal/depósito aunque el MVP opere una sola.
**Por qué:** evitar una migración dolorosa después. El costo de modelarlo bien ahora es bajo.

### ADR-010 — Auditoría transversal vía interceptor
**Decisión:** un interceptor/decorator `@Audited()` registra acciones administrativas automáticamente.
**Por qué:** cumplir "registrar todo" sin ensuciar cada caso de uso.

---

## 5. Flujos críticos (secuencias)

### 5.1 Checkout (B2C, Mercado Pago)
```
Cliente → web: confirma carrito
web → api: POST /orders (crea orden DRAFT, reserva stock)
api → MP: crea preferencia de pago
api → web: init_point (URL de MP)
Cliente → MP: paga (cuotas)
MP → api: webhook (payment.approved)   [idempotente]
api: orden PAID, confirma reserva de stock, encola email + (futuro) factura
api → web: redirect a confirmación
```
**Clave:** la reserva de stock se hace al crear la orden con expiración (Redis TTL); si no se paga, se libera. El webhook es idempotente (clave: payment id).

### 5.2 Presupuesto B2B
```
Cliente B2B → arma carrito con SUS precios (pricing module)
→ "Solicitar presupuesto"
api: crea Quote (snapshot de precios), genera PDF (job BullMQ)
→ cliente descarga PDF / envía por WhatsApp/email
Admin: revisa, ajusta, aprueba
→ Quote APPROVED → puede convertirse en Order (un click)
```
**Clave:** el presupuesto congela precios (snapshot) con fecha de validez. La inflación no rompe presupuestos ya emitidos.

### 5.3 Actualización masiva de precios
```
Admin: "subir 12% marca X" o importa CSV de costos
api: encola job → recalcula precio = costo × (1 + margen) por regla
→ actualiza, registra en histórico de precios, reindexa búsqueda
→ notifica al admin al terminar (progreso en vivo)
```

---

## 6. Cache y rendimiento

| Qué | Estrategia |
|---|---|
| Páginas de producto/categoría | ISR (revalidación incremental) + `revalidateTag` al editar |
| Catálogo/filtros | Cache Redis con invalidación por tag |
| Sesiones / carrito anónimo | Redis |
| Datos de cliente B2B (precios) | No cachear en CDN (privado); cache corto en server |
| Imágenes | Cloudinary CDN + `next/image` |
| Búsqueda | Índice dedicado (FTS/Meili), debounce en front |

---

## 7. Entornos y despliegue

| Entorno | Front | Back | DB |
|---|---|---|---|
| **dev** | local (`pnpm dev`) | local | docker-compose (postgres+redis+mailhog) |
| **staging** | Vercel preview | Railway staging | Postgres staging |
| **prod** | Vercel | Railway | Postgres prod + backups |

**CI/CD (GitHub Actions):** lint → typecheck → test → build → migraciones (deploy) → deploy. Preview por PR. Migraciones Prisma versionadas, nunca `db push` en prod.

---

## 8. Observabilidad

- **Logs** estructurados (pino) con request-id y user-id (sin PII sensible).
- **Errores**: Sentry (front y back).
- **Métricas**: health checks, latencia de endpoints, estado de colas.
- **Uptime**: monitor externo + alertas.

---

## 9. Preparación para el futuro (sin construirlo ahora)

| Futuro | Cómo lo deja listo la arquitectura |
|---|---|
| App móvil | API REST agnóstica + tipos compartidos en `packages/types` |
| GraphQL | Capa de presentación adicional sobre los mismos casos de uso |
| Marketplace externo | `Seller` como entidad; productos ya tienen `proveedor`; pricing por vendedor |
| Multi-sucursal / depósito | Stock ya modelado por ubicación (ADR-009) |
| ERP / CRM / WhatsApp API / AFIP | Módulo `integrations` con adaptadores; eventos de dominio publicables |
| Shops sociales (Meta/TikTok) | Feed de productos (Google Shopping) reutilizable |

---

Ver siguiente: [02-DATABASE.md](./02-DATABASE.md)
