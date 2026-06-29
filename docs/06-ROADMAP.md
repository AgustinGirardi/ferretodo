# 06 · ROADMAP — Plan de Desarrollo por Fases

**Proyecto:** FERRETODO
**Versión:** 1.0 (Blueprint)

> Filosofía: arquitectura preparada para la visión de 10 años, pero **salir a vender en 6-8 semanas**. Cada fase tiene un criterio de salida claro y entrega valor por sí sola.

---

## Visión general

```
FASE 0 · Fundaciones          (sem 1-2)   ── cimientos técnicos
FASE 1 · MVP COMERCIAL        (sem 3-8)   ── 🚀 SALE A VENDER
FASE 2 · B2B + Conversión     (mes 3-4)   ── ingreso recurrente
FASE 3 · IA + Escala          (mes 5-6)   ── diferenciación
FASE 4 · Plataforma           (futuro)    ── marketplace, app, ERP
```

El **MVP aprobado** abarca los 4 pilares (Catálogo+Checkout, WhatsApp+Presupuestos, B2B básico, Panel Admin). Para que el MVP salga rápido sin recortar pilares, **cada pilar tiene un "corte mínimo viable"** en Fase 1, y se profundiza en Fase 2.

---

## FASE 0 — Fundaciones (semanas 1-2)

**Objetivo:** que todo lo demás se construya sobre cimientos sólidos.

- [ ] Monorepo (Turborepo + pnpm), estructura `apps/` + `packages/`.
- [ ] Config compartida (`packages/config`: ESLint, TS, Tailwind preset).
- [ ] Next.js + NestJS "hello world" desplegables.
- [ ] Postgres + Prisma + schema núcleo + migración inicial + seed.
- [ ] Redis + BullMQ configurados.
- [ ] `docker-compose` para dev (postgres + redis + mailhog).
- [ ] Auth básico: registro, login, refresh tokens, RBAC, guard de permisos.
- [ ] Design system base: tokens, tema claro/oscuro, componentes shadcn, layout.
- [ ] CI/CD (GitHub Actions): lint + typecheck + test + build + deploy preview.
- [ ] Sentry + logging estructurado.

**Criterio de salida:** un usuario se registra y loguea; un admin entra al panel vacío; pipeline verde; deploy a staging funcionando.

---

## FASE 1 — MVP Comercial (semanas 3-8) 🚀

**Objetivo:** plataforma que **vende de verdad**, con los 4 pilares en su corte mínimo viable.

### Pilar 1 — Catálogo + Checkout
- [ ] Catálogo: productos, categorías, marcas; listado con filtros y orden; paginación/infinite scroll.
- [ ] Búsqueda Postgres FTS + `pg_trgm` (typo-tolerance) + autocompletado.
- [ ] Ficha de producto completa (galería, zoom, specs, relacionados).
- [ ] Carrito (anónimo + logueado, merge, guardar para después, cross-sell).
- [ ] Checkout en flujo único (invitado + cuenta).
- [ ] **Mercado Pago** (Checkout Pro + cuotas) + webhook idempotente; transferencia; efectivo/retiro.
- [ ] Reserva de stock con expiración.
- [ ] Envíos: retiro en local + costo por zona Río Cuarto.
- [ ] Emails transaccionales (Resend): confirmación + estados.
- [ ] Home completa.

### Pilar 2 — WhatsApp + Presupuestos
- [ ] FAB WhatsApp (consultar producto, enviar carrito, link `wa.me`).
- [ ] Generador de presupuesto + PDF + envío WhatsApp/email.
- [ ] Aprobación/edición de presupuesto por admin + convertir a pedido.

### Pilar 3 — B2B básico
- [ ] Tipos de cliente + listas de precios + resolución de precio (módulo `pricing`).
- [ ] Datos fiscales (CUIT, condición IVA) en perfil; precios netos para B2B.
- [ ] Cuenta corriente (saldo + movimientos, gestión manual).

### Pilar 4 — Panel Admin
- [ ] Dashboard con métricas base (ventas día/mes, top productos).
- [ ] CRUD productos (todos los campos) + duplicar + estados.
- [ ] Gestión de imágenes (drag&drop, reordenar, optimización Cloudinary).
- [ ] Actualización masiva de precios (costo+margen, %, por marca/categoría) y stock.
- [ ] Import/Export CSV/Excel con preview y reporte de errores.
- [ ] CRUD categorías, subcategorías, marcas, proveedores.
- [ ] Gestión de pedidos (estados) y clientes.
- [ ] Usuarios internos, roles, permisos.
- [ ] Auditoría de acciones; 2FA admin.

### Transversal Fase 1
- [ ] SEO base (meta dinámicos, OG, Schema Product/LocalBusiness, sitemap, robots, breadcrumbs).
- [ ] Performance (ISR, imágenes, lazy load) → CWV en verde móvil.
- [ ] Accesibilidad AA en flujos críticos.
- [ ] Seguridad base (rate limit, captcha, helmet, validación, CSRF).
- [ ] Tests: unit de `pricing`/`orders`/`inventory`, E2E de compra y presupuesto.

**Criterio de salida (Definition of Done del MVP):** ver [00-PRD.md](./00-PRD.md) §9. En resumen: B2C compra con MP; B2B ve sus precios y genera presupuesto PDF por WhatsApp; admin gestiona catálogo/precios/stock/pedidos; backups probados; CI verde.

---

## FASE 2 — B2B + Conversión (mes 3-4)

**Objetivo:** profundizar lo que genera ingreso recurrente y subir la conversión.

- [ ] Listas de precios avanzadas (precio fijo por producto/lista, importables).
- [ ] Repetir compra, lista de compras, lista de deseos, favoritos completos.
- [ ] Presupuestos avanzados (validez, versiones, recordatorios).
- [ ] **Reseñas y preguntas** (con moderación).
- [ ] **Comprados juntos / recomendaciones por reglas** (co-ocurrencia).
- [ ] Marketing: cupones, ofertas flash con countdown, combos, 2x1, descuento por cantidad/transferencia/cumpleaños.
- [ ] Newsletter.
- [ ] Dashboard completo (ganancias, conversión, abandono, comparación mensual, gráficos interactivos).
- [ ] Inventario: alertas de stock mínimo, productos agotados/bajo stock, historial de movimientos.
- [ ] Búsqueda → **Meilisearch** (instantánea, facets).
- [ ] Analytics: GA4 + GTM + Meta Pixel (con consentimiento).

**Criterio de salida:** B2B recompra fácil; conversión medible y mejorando; catálogo con prueba social.

---

## FASE 3 — IA + Escala (mes 5-6)

**Objetivo:** diferenciación e inteligencia operativa.

- [ ] **Búsqueda semántica/conversacional** ("necesito una mecha para pared") con embeddings + recomendación.
- [ ] **Recomendaciones IA** (personalizadas, "para tu obra").
- [ ] **Generación IA de descripciones** de producto (admin).
- [ ] **IA para el admin:** productos sin venta, más rentables/vistos/abandonados, sugerencias de promociones, recomendaciones para aumentar ventas (mayormente analítica + reglas; LLM donde aporte).
- [ ] **Recuperación de carritos abandonados** (email + WhatsApp automatizado).
- [ ] **Multi-sucursal / multi-depósito** operativo.
- [ ] **Facturación AFIP** (Factura A/B/C electrónica).
- [ ] **Notificaciones push** (web push).
- [ ] Preparado eliminación de fondo de imágenes con IA.

**Criterio de salida:** búsqueda inteligente en producción; admin con insights accionables; facturación electrónica operativa.

---

## FASE 4 — Plataforma (futuro)

- [ ] **Marketplace** con vendedores externos (entidad `Seller`, pricing por vendedor, comisiones).
- [ ] **App móvil** (Expo/React Native) reusando la API y `packages/types`.
- [ ] Integraciones **ERP / CRM / WhatsApp Business API**.
- [ ] **Shops sociales:** Facebook/Instagram Shop, TikTok Shop, Google Shopping feed.
- [ ] GraphQL gateway.

---

## Estrategia de testing (transversal)

| Nivel | Qué | Herramienta | Cuándo |
|---|---|---|---|
| **Unit** | dominio, casos de uso, pricing | Vitest/Jest | desde Fase 0 |
| **Integración** | módulos contra Postgres test | Jest + Testcontainers | Fase 1+ |
| **E2E API** | flujos críticos (checkout, quote, B2B) | supertest | Fase 1 |
| **E2E UI** | compra, presupuesto, login | Playwright | Fase 1 |
| **Visual/A11y** | regresión visual + axe | Playwright + axe | Fase 2 |
| **Carga** | catálogo y checkout bajo carga | k6 | antes de cada release grande |

Cobertura objetivo: ≥ 80% en módulos críticos (`pricing`, `orders`, `inventory`, `payments`). Gate en CI.

---

## Backups y recuperación (transversal)

- Backups automáticos diarios de Postgres (retención 30 días) + WAL para PITR.
- **Restauración probada** al menos una vez antes del launch y luego trimestral.
- Medios (Cloudinary) con su propia redundancia; export periódico de metadatos.
- Runbook de recuperación documentado en [08-SECURITY.md](./08-SECURITY.md).

---

## Plan de mantenimiento y escalabilidad

- Actualización de dependencias mensual (Renovate/Dependabot) + revisión de seguridad.
- Monitoreo de CWV, errores (Sentry), colas y DB; alertas.
- Escalado: Vercel (front auto), Railway (réplicas API), Postgres (read replicas cuando haga falta), Redis para cache caliente.
- Revisión trimestral de índices y queries lentas.

---

Ver siguiente: [07-TASKS.md](./07-TASKS.md)
