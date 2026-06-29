# 07 · TASKS — Backlog Accionable

**Proyecto:** FERRETODO
**Versión:** 1.0 (Blueprint)

> Backlog ejecutable para construir el MVP. Marcá `[x]` a medida que avances.
> Convención de IDs: `F<fase>-<área>-<n>`. Áreas: INF (infra), BE (backend), FE (frontend), DS (design), QA (testing), SEC (seguridad).

---

## FASE 0 — Fundaciones

### Infra / setup
- [ ] **F0-INF-1** Inicializar monorepo: pnpm workspaces + Turborepo (`turbo.json`, `pnpm-workspace.yaml`).
- [ ] **F0-INF-2** `packages/config`: tsconfig base, ESLint + Prettier, Tailwind preset compartido.
- [ ] **F0-INF-3** `apps/web` Next.js 15 (App Router, TS) arrancando.
- [ ] **F0-INF-4** `apps/api` NestJS (TS) arrancando con `/health`.
- [ ] **F0-INF-5** `docker-compose.yml` dev: postgres + redis + mailhog.
- [ ] **F0-INF-6** `packages/db`: Prisma init, `schema.prisma` núcleo, primera migración.
- [ ] **F0-INF-7** Seed (`seed.ts`): roles, permisos, tipos de cliente, sucursal, categorías, marcas, productos demo.
- [ ] **F0-INF-8** Redis + BullMQ (`infra/queues`).
- [ ] **F0-INF-9** Config con validación zod (`config/env.ts`), `.env.example`.
- [ ] **F0-INF-10** GitHub Actions: lint → typecheck → test → build → deploy preview (Vercel + Railway).
- [ ] **F0-INF-11** Sentry + logger pino.

### Backend base
- [ ] **F0-BE-1** `PrismaService`, `RedisService`, `StorageProvider` (interfaz + Cloudinary).
- [ ] **F0-BE-2** Shared kernel: `Result`, `AppError`, base repository, base entity.
- [ ] **F0-BE-3** Módulo `auth`: register, login, refresh (rotación + reuse detection), logout, forgot/reset.
- [ ] **F0-BE-4** Módulo `users`/RBAC: roles, permisos, `RolesGuard`, `PermissionsGuard`, `@RequirePermissions`.
- [ ] **F0-BE-5** `ValidationPipe` global, filtro de errores uniforme, interceptor de respuesta.
- [ ] **F0-BE-6** Swagger en `/api/docs`.

### Design system base
- [ ] **F0-DS-1** Tokens (CSS vars) light/dark + `next-themes`.
- [ ] **F0-DS-2** Instalar shadcn/ui + lucide; configurar `packages/ui`.
- [ ] **F0-DS-3** Layout raíz tienda (header/footer) + layout admin (dark).
- [ ] **F0-DS-4** Componentes base (Button variantes, Input, Card, Badge, Dialog, Drawer, Toast).

---

## FASE 1 — MVP Comercial

### Catálogo (BE)
- [ ] **F1-BE-1** Módulo `catalog`: entidades Product/Category/Brand/Supplier (Clean Arch).
- [ ] **F1-BE-2** `GET /products` con filtros (precio, marca, stock, oferta, novedades, categoría, rating) + orden + paginación/cursor.
- [ ] **F1-BE-3** `GET /products/:slug` (+ viewCount async) y `/related`.
- [ ] **F1-BE-4** CRUD admin de productos + duplicar + estados.
- [ ] **F1-BE-5** Categorías (árbol), marcas, proveedores (CRUD admin).
- [ ] **F1-BE-6** Subida de imágenes a Cloudinary (firma) + thumbnails + reordenar.
- [ ] **F1-BE-7** Import CSV/Excel (job BullMQ + preview + reporte de errores).
- [ ] **F1-BE-8** Export productos.
- [ ] **F1-BE-9** Actualización masiva de precios (costo+margen, %, marca/categoría) + `PriceHistory`.
- [ ] **F1-BE-10** Actualización masiva de stock.

### Búsqueda (BE)
- [ ] **F1-BE-11** Migración SQL índices GIN (trgm + tsvector + unaccent).
- [ ] **F1-BE-12** `GET /search` (typo-tolerance, sinónimos básicos) + `/autocomplete`.

### Pricing / B2B (BE)
- [ ] **F1-BE-13** Módulo `pricing`: `CustomerType`, `PriceList`, resolución de precio (ver [02-DATABASE.md](./02-DATABASE.md) §4).
- [ ] **F1-BE-14** Módulo `customers`: perfil, datos fiscales, direcciones, favoritos, listas.
- [ ] **F1-BE-15** Cuenta corriente: `CreditAccount` + `CreditMovement` (alta/consulta).

### Inventario (BE)
- [ ] **F1-BE-16** Módulo `inventory`: `Branch`, `InventoryItem`, `StockMovement`, reserva/liberación transaccional.

### Carrito + Pedidos + Pagos + Envíos (BE)
- [ ] **F1-BE-17** Módulo `cart`: anónimo (session) + logueado, merge, cupón, guardar para después.
- [ ] **F1-BE-18** Módulo `orders`: `CreateOrderUseCase` (transacción: pricing + reserva stock + snapshots).
- [ ] **F1-BE-19** Estados de pedido + endpoint admin de cambio de estado.
- [ ] **F1-BE-20** Módulo `payments`: `PaymentProvider` + adaptador Mercado Pago (preferencia + cuotas).
- [ ] **F1-BE-21** Webhook MP idempotente con verificación de firma → confirma orden/stock.
- [ ] **F1-BE-22** Transferencia (con descuento) y efectivo/retiro como métodos.
- [ ] **F1-BE-23** Módulo `shipping`: cotización por zona Río Cuarto + retiro en local.
- [ ] **F1-BE-24** Liberación de stock de órdenes expiradas (cron BullMQ).

### Presupuestos + Notificaciones (BE)
- [ ] **F1-BE-25** Módulo `quotes`: crear desde carrito (snapshot), estados, validez.
- [ ] **F1-BE-26** Generación de PDF de presupuesto (job).
- [ ] **F1-BE-27** Aprobar/rechazar/convertir presupuesto → pedido.
- [ ] **F1-BE-28** Módulo `notifications`: `EmailProvider` (Resend) + plantillas (confirmación, estados, reset).
- [ ] **F1-BE-29** `MessagingProvider` WhatsApp (links `wa.me`: producto, carrito, presupuesto).

### Auditoría / Dashboard (BE)
- [ ] **F1-BE-30** Interceptor `@Audited()` + `AuditLog` + consulta admin.
- [ ] **F1-BE-31** `GET /admin/dashboard` (ventas día/mes, top productos, conteos).
- [ ] **F1-BE-32** 2FA (TOTP) para roles internos.

### Frontend tienda
- [ ] **F1-FE-1** Home (hero, categorías, ofertas+countdown, destacados, novedades, más vendidos, marcas, beneficios, mapa, contacto, footer, newsletter).
- [ ] **F1-FE-2** Catálogo `/productos` + `/categoria/[slug]` + `/marca/[slug]` (filtros, orden, grid, skeletons, infinite scroll móvil, estado en URL).
- [ ] **F1-FE-3** Ficha de producto (galería+zoom, PriceTag, cuotas, StockBadge, CTAs, tabs, relacionados, sticky bar móvil, B2BPriceBlock).
- [ ] **F1-FE-4** Buscador con autocompletado (Command) + página de resultados.
- [ ] **F1-FE-5** Carrito + CartDrawer (cantidades, eliminar, guardar para después, cross-sell, totales).
- [ ] **F1-FE-6** Checkout flujo único (datos → entrega → pago → confirmación; invitado + cuenta).
- [ ] **F1-FE-7** Integración Mercado Pago (redirect Checkout Pro) + páginas de resultado.
- [ ] **F1-FE-8** Generador de presupuesto `/presupuesto` (PDF, WhatsApp, email).
- [ ] **F1-FE-9** WhatsAppFAB global.
- [ ] **F1-FE-10** Área de cuenta (perfil, pedidos, presupuestos, favoritos, listas, direcciones, cuenta corriente B2B).
- [ ] **F1-FE-11** Auth UI (login, registro, recuperar) + manejo de sesión/refresh.
- [ ] **F1-FE-12** Páginas institucionales (contacto, ayuda/FAQ, cómo comprar, envíos).

### Frontend admin
- [ ] **F1-FE-13** Layout admin (sidebar, topbar, dark) + dashboard con gráficos (StatCard, ChartCard).
- [ ] **F1-FE-14** Productos: DataTable + editor completo + ImageUploader (drag&drop, reordenar, recorte).
- [ ] **F1-FE-15** Importador CSV/Excel (preview + progreso del job + errores).
- [ ] **F1-FE-16** Acciones masivas: precios y stock (BulkActionBar).
- [ ] **F1-FE-17** Categorías, marcas, proveedores.
- [ ] **F1-FE-18** Pedidos (listado, detalle, cambio de estado) y presupuestos (aprobar/convertir).
- [ ] **F1-FE-19** Clientes (incl. tipo, cuenta corriente) y usuarios/roles/permisos.
- [ ] **F1-FE-20** Auditoría (AuditTrail) + configuración + 2FA.

### Transversal Fase 1
- [ ] **F1-SEC-1** Rate limit (throttler), Helmet, CORS allowlist, captcha (Turnstile) en auth/registro/newsletter.
- [ ] **F1-SEC-2** Sanitización HTML descripciones, CSRF, body limits, recalcular precios server-side.
- [ ] **F1-SEC-3** Backups automáticos Postgres + primera restauración de prueba.
- [ ] **F1-FE-21** SEO: metadata dinámica, OG/Twitter, JSON-LD (Product, LocalBusiness, Breadcrumb, FAQ), sitemap, robots.
- [ ] **F1-FE-22** Performance pass: imágenes, ISR, lazy load, presupuesto JS → CWV verde.
- [ ] **F1-FE-23** Accesibilidad pass (axe) en flujos críticos.
- [ ] **F1-QA-1** Unit `pricing`/`orders`/`inventory`.
- [ ] **F1-QA-2** E2E API: checkout, webhook MP, presupuesto, precios B2B.
- [ ] **F1-QA-3** E2E UI (Playwright): compra completa, presupuesto, login/registro.

---

## FASE 2+ (resumen — detallar al planificar la fase)

- **F2:** listas de precios avanzadas, repetir compra/listas, reseñas+preguntas, comprados-juntos, cupones/promos/combos/2x1/cantidad/transferencia/cumpleaños, newsletter, dashboard completo, alertas de inventario, Meilisearch, GA4/GTM/Pixel.
- **F3:** búsqueda semántica IA, recomendaciones IA, descripciones IA, IA admin (insights), recuperación de carritos, multi-sucursal operativa, AFIP, push.
- **F4:** marketplace externo, app móvil Expo, ERP/CRM, shops sociales, GraphQL.

(Detalle en [06-ROADMAP.md](./06-ROADMAP.md).)

---

## Primeros 10 pasos sugeridos (si arrancamos a codear hoy)

1. `F0-INF-1` monorepo. 2. `F0-INF-3/4` web+api arriba. 3. `F0-INF-6` Prisma + schema. 4. `F0-INF-7` seed. 5. `F0-DS-1/2` tokens + shadcn. 6. `F0-BE-3` auth. 7. `F0-BE-4` RBAC. 8. `F1-BE-1/2/3` catálogo. 9. `F1-FE-2/3` catálogo + ficha. 10. `F1-FE-1` home.

---

Ver siguiente: [08-SECURITY.md](./08-SECURITY.md)
