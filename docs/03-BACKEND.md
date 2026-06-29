# 03 · BACKEND — Especificación del Backend

**Proyecto:** FERRETODO
**Stack:** NestJS · Node.js · TypeScript · Prisma · Redis · BullMQ
**Versión:** 1.0 (Blueprint)

---

## 1. Organización

Monolito modular. Un módulo NestJS por **bounded context**, cada uno con la estructura Clean Architecture descrita en [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) §3.

```
apps/api/src/
├── modules/
│   ├── auth/          login, refresh, 2FA, reset password, guards
│   ├── users/         usuarios internos, roles, permisos
│   ├── customers/     perfil B2B/B2C, direcciones, cuenta corriente
│   ├── catalog/       productos, categorías, marcas, proveedores
│   ├── inventory/     stock, movimientos, sucursales, alertas
│   ├── pricing/       listas de precios, resolución de precio, descuentos
│   ├── search/        búsqueda, autocompletar, filtros
│   ├── cart/          carrito anónimo/logueado, merge
│   ├── orders/        pedidos, estados, reserva de stock
│   ├── payments/      PaymentProvider (MercadoPago…), webhooks
│   ├── shipping/      retiro/envío, zonas, costos
│   ├── quotes/        presupuestos, PDF, conversión a pedido
│   ├── marketing/     cupones, promociones, banners, newsletter
│   ├── reviews/       opiniones y preguntas
│   ├── notifications/ email (Resend), whatsapp, push
│   ├── analytics/     métricas, dashboard, eventos
│   ├── audit/         interceptor + consulta de logs
│   └── admin/         endpoints agregados del panel
├── shared/            Result, AppError, base entity/repo, decorators
├── infra/             PrismaService, RedisService, StorageProvider, queues
├── config/            env validation (zod), config service
└── main.ts
```

---

## 2. Convenciones de API

- **Base URL:** `/api/v1`
- **Formato:** JSON. Fechas ISO-8601. Dinero en string decimal (`"1234.50"`) para no perder precisión.
- **Auth:** `Authorization: Bearer <accessToken>` (JWT corto) + refresh token en cookie `httpOnly`.
- **Errores:** envoltura uniforme.

```jsonc
// éxito
{ "data": { ... }, "meta": { "page": 1, "total": 240 } }
// error
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "...", "details": [] } }
```

- **Paginación:** `?page=1&limit=24` (cursor opcional para infinite scroll: `?cursor=...`).
- **Filtros/orden:** `?category=...&brand=...&minPrice=...&sort=price_asc`.
- **Idempotencia:** webhooks y creación de órdenes aceptan `Idempotency-Key`.
- **Versionado:** prefijo de versión en la URL; cambios breaking → `/v2`.
- **Validación:** `class-validator` + `ValidationPipe` global (whitelist + forbidNonWhitelisted). DTOs en `packages/types`.
- **Documentación:** OpenAPI/Swagger autogenerado en `/api/docs`.

---

## 3. Endpoints principales (MVP)

### Auth (`/api/v1/auth`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register` | Registro de cliente |
| POST | `/login` | Login → access + refresh |
| POST | `/refresh` | Rotar tokens |
| POST | `/logout` | Revocar refresh |
| POST | `/forgot-password` | Enviar email de reset |
| POST | `/reset-password` | Cambiar con token |
| POST | `/2fa/setup` · `/2fa/verify` | 2FA (admins) |
| GET  | `/me` | Perfil actual |

### Catálogo (`/catalog`)
| Método | Ruta | Notas |
|---|---|---|
| GET | `/products` | listado paginado + filtros + orden |
| GET | `/products/:slug` | ficha (incrementa viewCount async) |
| GET | `/products/:id/related` | relacionados/similares/comprados-juntos |
| GET | `/categories` · `/categories/:slug` | árbol y por categoría |
| GET | `/brands` | marcas |
| POST/PATCH/DELETE | `/admin/products...` | CRUD (rol con permiso) |
| POST | `/admin/products/:id/duplicate` | duplicar |
| POST | `/admin/products/import` | import CSV/Excel (job) |
| GET  | `/admin/products/export` | export |
| POST | `/admin/prices/bulk` | actualización masiva de precios (job) |
| POST | `/admin/stock/bulk` | actualización masiva de stock (job) |

### Búsqueda (`/search`)
| GET | `/search?q=...` | resultados con typo-tolerance |
| GET | `/search/autocomplete?q=...` | sugerencias |

### Carrito (`/cart`)
| GET | `/cart` | carrito actual (cookie/session o user) |
| POST | `/cart/items` · PATCH/DELETE `/cart/items/:id` | gestionar ítems |
| POST | `/cart/merge` | fusionar anónimo → logueado |
| POST | `/cart/coupon` | aplicar cupón |

### Pedidos / Checkout (`/orders`)
| POST | `/orders` | crear orden (reserva stock) |
| GET | `/orders/:id` | detalle |
| GET | `/orders` | historial del cliente |
| PATCH | `/admin/orders/:id/status` | cambiar estado |

### Pagos (`/payments`)
| POST | `/payments/mercadopago/preference` | crear preferencia |
| POST | `/payments/webhook/mercadopago` | webhook (idempotente, verifica firma) |

### Presupuestos (`/quotes`)
| POST | `/quotes` | crear desde carrito (snapshot precios) |
| GET | `/quotes/:id` · `/quotes/:id/pdf` | ver / descargar PDF |
| POST | `/admin/quotes/:id/approve` · `/reject` | gestión admin |
| POST | `/quotes/:id/convert` | convertir en pedido |

### Clientes B2B (`/customers`)
| GET/PATCH | `/customers/me` | perfil, datos fiscales |
| GET | `/customers/me/credit` | cuenta corriente y movimientos |
| CRUD | `/me/addresses`, `/me/favorites`, `/me/shopping-lists` | |

### Envíos (`/shipping`)
| POST | `/shipping/quote` | costo por zona / retiro |

### Marketing / Admin / Analytics
| GET | `/admin/dashboard` | métricas agregadas |
| CRUD | `/admin/coupons`, `/admin/promotions`, `/admin/banners` | |
| CRUD | `/admin/users`, `/admin/customers`, `/admin/suppliers`, `/admin/branches` | |
| GET | `/admin/audit` | log de auditoría |
| POST | `/newsletter/subscribe` | suscripción |

---

## 4. Autenticación y autorización

### Tokens
- **Access token** JWT, vida corta (~15 min), firmado (RS256 o HS256), payload mínimo (`sub`, `role`, `permissions` hash).
- **Refresh token** opaco, almacenado **hasheado** en DB (`RefreshToken`), en cookie `httpOnly`+`Secure`+`SameSite=Strict`. Rotación en cada refresh; reuse detection (si se usa uno revocado → invalidar familia).
- **OAuth preparado:** `AuthProvider` con estrategia local; Google/Apple se agregan como estrategias Passport sin tocar el dominio.

### RBAC con permisos granulares
- `RolesGuard` + `PermissionsGuard`. Decorador `@RequirePermissions('product:create')`.
- Roles seed: Administrador, Empleado, Vendedor, Depósito, Contador, Cliente. Permisos formato `recurso:accion`, asignables independientemente.

### 2FA (admins)
- TOTP (otplib). Obligatorio para roles internos. Códigos de recuperación.

---

## 5. Patrones de implementación

### Result pattern (sin excepciones para flujo de negocio)
```ts
// shared/result.ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```
Los casos de uso devuelven `Result`; el controlador lo mapea a HTTP. Las excepciones quedan para errores realmente inesperados.

### Repository (puerto + adaptador)
```ts
// domain/repositories/product.repository.ts
export abstract class ProductRepository {
  abstract findBySlug(slug: string): Promise<Product | null>;
  abstract save(product: Product): Promise<void>;
}
// infrastructure/prisma-product.repository.ts  → implementa con PrismaService
```
Inyección por token; tests usan implementación en memoria.

### Caso de uso (ejemplo)
```ts
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly inventory: InventoryService,
    private readonly pricing: PricingService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreateOrderDto): Promise<Result<Order>> {
    return this.prisma.$transaction(async (tx) => {
      // 1. resolver precios (pricing) según tipo de cliente
      // 2. reservar stock (falla si insuficiente)
      // 3. crear orden con snapshots
      // 4. crear preferencia de pago
    });
  }
}
```

---

## 6. Colas y jobs (BullMQ + Redis)

| Cola | Job | Disparador |
|---|---|---|
| `emails` | confirmación, estados, reset, newsletter | eventos de dominio |
| `pdf` | generar PDF de presupuesto/factura | crear/aprobar quote |
| `import` | procesar CSV/Excel de productos | upload admin |
| `pricing` | recálculo masivo de precios | bulk update |
| `search-index` | reindexar producto | create/update product |
| `inventory` | liberar stock de órdenes expiradas | cron |
| `analytics` | agregaciones de dashboard | cron |

Jobs idempotentes, con reintentos exponenciales y dead-letter. Progreso reportable al panel (WebSocket/polling).

---

## 7. Integraciones externas (adaptadores)

| Servicio | Interfaz | Notas MVP |
|---|---|---|
| **Mercado Pago** | `PaymentProvider` | Checkout Pro + cuotas; webhook con verificación de firma |
| **Resend** | `EmailProvider` | plantillas React Email |
| **Cloudinary** | `StorageProvider` | upload firmado, transformaciones |
| **WhatsApp** | `MessagingProvider` | MVP: links `wa.me`; futuro: WhatsApp Business API |
| **Búsqueda** | `SearchProvider` | MVP: Postgres; futuro: Meilisearch |

Cada uno detrás de interfaz → swap sin tocar dominio.

---

## 8. Seguridad del backend

(Detalle completo en [08-SECURITY.md](./08-SECURITY.md).)

- **SQLi:** Prisma parametriza; `$queryRaw` solo con `Prisma.sql` templating.
- **XSS:** sanitización de HTML en descripciones (DOMPurify server-side); escape en front.
- **CSRF:** cookies `SameSite=Strict` + token CSRF para endpoints con cookie.
- **Rate limit:** `@nestjs/throttler` global + límites estrictos en auth/checkout/búsqueda.
- **Captcha:** Turnstile/hCaptcha en registro, login (tras fallos) y newsletter.
- **Helmet**, CORS allowlist, body size limits.
- **Validación** estricta de DTOs; nunca confiar en el cliente para precios (se recalculan server-side).
- **Secrets** vía variables de entorno validadas con zod; nada en el repo.
- **Webhooks** verifican firma + idempotencia.
- **Auditoría** automática de acciones admin (interceptor `@Audited()`).

---

## 9. Configuración y entorno

`.env` validado al boot (falla rápido si falta algo):

```
DATABASE_URL, REDIS_URL,
JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL,
MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET,
CLOUDINARY_URL, RESEND_API_KEY,
WHATSAPP_PHONE, APP_URL, API_URL,
TURNSTILE_SECRET, SENTRY_DSN
```

---

## 10. Testing (backend)

- **Unit:** casos de uso y dominio con repos en memoria (Vitest/Jest).
- **Integración:** módulos contra Postgres de test (Testcontainers o DB efímera).
- **E2E de API:** supertest sobre la app Nest (flujo de checkout, presupuesto, pricing B2B).
- **Cobertura objetivo:** ≥ 80% en `pricing`, `orders`, `inventory` (lo crítico).

Estrategia completa en [06-ROADMAP.md](./06-ROADMAP.md) §Testing.

---

Ver siguiente: [04-FRONTEND.md](./04-FRONTEND.md)
