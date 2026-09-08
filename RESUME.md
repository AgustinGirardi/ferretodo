# 📌 RESUME — Punto de continuación de FERRETODO

> Estado del proyecto para retomarlo en cualquier momento.
> Última actualización: **2026-07-06**

---

## ¿Qué es esto?

**FERRETODO** es un e-commerce de ferretería **completo y autoadministrable**, pensado para
venderlo a un dueño que **no sabe programar** y lo gestiona solo desde un panel.

- **Repo:** https://github.com/AgustinGirardi/ferretodo · rama principal `main`
- **Stack:** Next.js 15 (full-stack, App Router) · Prisma + **SQLite** · Tailwind · Zustand · Resend · jose (JWT)
- **Negocio:** ferretería y corralón. Los datos de contacto del sitio son de
  demostración y viven en `apps/web/lib/site.ts`.
- **🟢 EN PRODUCCIÓN:** desplegada en **Render** → `https://ferretodo-m9dr.onrender.com`
  (dominio propio todavía pendiente de comprar/conectar)

---

## ▶️ Cómo levantarlo en local

```bash
git clone https://github.com/AgustinGirardi/ferretodo.git
cd ferretodo
cp apps/web/.env.example apps/web/.env   # completar AUTH_SECRET y demás variables
pnpm install                             # solo la primera vez
pnpm --filter @ferretodo/web db:migrate
pnpm --filter @ferretodo/web db:seed     # catálogo de demo + admin inicial
pnpm --filter @ferretodo/web dev         # tienda: http://localhost:3000
```

- **Tienda:** http://localhost:3000 · **Panel admin:** http://localhost:3000/admin
- **Admin local:** las credenciales del admin de desarrollo se definen en `apps/web/prisma/seed.ts`
  y sirven **solo para local**. En producción el admin inicial se crea a partir de las variables
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` y la contraseña se cambia desde el panel en el primer ingreso.
- **AUTH_SECRET:** generá uno propio (mínimo 32 caracteres aleatorios) en `apps/web/.env`.
  Nunca se versiona: `.env` está en `.gitignore`.

Recrear la base desde cero: `pnpm --filter @ferretodo/web db:migrate && db:seed`

> ⚠️ **OneDrive causa problemas.** Ya pasó: genera copias de conflicto
> y puede revertir el HEAD local a un commit viejo. Si aparecen archivos de conflicto o el
> build falla con contenido "viejo", **NO asumir pérdida**: hacer `git fetch` + `git log --oneline -1`
> (GitHub siempre tuvo el trabajo intacto) y `git reset --hard origin/main`. También el clásico
> `EPERM/EINVAL` sobre `.next` o el motor de Prisma: parar el dev server, borrar `apps/web/.next`,
> reintentar. **Recomendado a futuro: mover el proyecto fuera de OneDrive.**

---

## ✅ Qué está hecho y funcionando (todo verificado y en producción)

### Tienda (cliente)
- [x] Home editable (banner, beneficios, categorías, destacados, más vendidos)
- [x] Catálogo con filtros (categoría, marca, precio, oferta, stock) y ordenamientos
- [x] Páginas por categoría · Ficha de producto (galería, cuotas, stock, relacionados, JSON-LD)
- [x] Buscador con autocompletado (tolerante a acentos)
- [x] Carrito persistente en el navegador
- [x] **Checkout** (datos → entrega → pago) con validación fuerte de email/teléfono/zona/dirección
- [x] **Stock real:** se descuenta al vender (transacción anti-carrera) y se repone al cancelar
- [x] **Pago en efectivo solo con retiro en el local** (envío a domicilio = MP o transferencia)
- [x] **Email de confirmación** del pedido (Resend, con fallback simulado si no hay API key)
- [x] **Cuentas de cliente:** registro/login/logout en `/cuenta` + "Mis pedidos" (por `customerId`)
- [x] **Tema claro/oscuro** con toggle en header y drawer mobile (default claro)
- [x] **Menú mobile** (drawer hamburguesa) + **filtros del catálogo en drawer** en mobile
- [x] **Páginas legales:** `/terminos`, `/privacidad`, `/ayuda`, `/arrepentimiento` (Res. 424/2020)
      + footer con links legales, botón de arrepentimiento destacado y slot para Data Fiscal AFIP
- [x] **SEO técnico:** `robots.txt` + `sitemap.xml` dinámico + metadata (URL vía `NEXT_PUBLIC_SITE_URL`)

### Panel de administración (`/admin`) — todo sin programar
- [x] Login seguro (JWT en cookie httpOnly + middleware) con **rate limit** (5 intentos/15 min)
- [x] Dashboard con métricas y últimos pedidos
- [x] **Productos:** crear/editar/eliminar (borrado seguro) + subir fotos arrastrando; campos de precio con separador de miles
- [x] **Categorías / Marcas / Portada:** ABM completo con vista previa en vivo
- [x] **Pedidos:** lista, detalle y cambio de estado (repone stock al cancelar)
- [x] **Ventas y movimientos:** KPIs (facturado, ventas, ticket, cancelados), desglose por pago,
      top productos, tabla de movimientos con filtro por período y **export CSV para Excel**
- [x] **Arrepentimientos:** gestión de solicitudes del botón de arrepentimiento
- [x] **Mi cuenta:** cambiar contraseña + **descargar copia de seguridad** de la base
- [x] **Tema claro/oscuro** propio del admin (independiente del de la tienda, default oscuro)

### Infraestructura / operación
- [x] **Deploy en Render** vía `render.yaml` (web service Starter + disco persistente en `/var/data`)
- [x] **Backups automáticos diarios** de la base (VACUUM INTO, rota y conserva 14) + descarga manual
- [x] **Bootstrap del admin inicial** en el primer arranque (vars `ADMIN_EMAIL`/`ADMIN_PASSWORD`)

### Seguridad (2 auditorías con el agente security-auditor, todo corregido y verificado)
- [x] `AUTH_SECRET` obligatorio ≥32 chars en producción (fail-fast, `lib/secret.ts`)
- [x] Rate limit en login, checkout (5/10min), registro y arrepentimiento (3/h)
- [x] Checkout: precios recalculados en server, solo productos activos, cantidades con tope
- [x] Upload: extensión derivada del MIME (no del nombre de archivo), tope 5 MB, auth
- [x] XSS de JSON-LD escapado · headers de seguridad (nosniff, X-Frame-Options DENY, HSTS)
- [x] CSV export a prueba de inyección de fórmulas · sin secretos en git · Next ^15.5.19 (CVE)
- [x] **CRÍTICO corregido (commit bc02544):** un cliente registrado podía usar su token para
      entrar al admin (mismo secreto, no se validaba el tipo). Ahora los tokens de admin llevan
      `typ:"admin"` exigido en `getAdminSession` y en el middleware.
- [x] **ALTO corregido (bc02544):** "Mis pedidos" se filtraba por email no verificado (se podía
      espiar a otro). Ahora se vincula por `Order.customerId` solo en compras con sesión iniciada.

---

## ⏳ Pendiente (en orden de prioridad)

1. **Deploy del último commit (`bc02544`) en Render.** ⚠️ Al hacerlo, la primera vez hay que
   **volver a iniciar sesión en el admin** (los tokens viejos sin `typ` quedaron inválidos — es esperado).
2. **Mercado Pago real** — hoy el pago es **simulado** (el pedido se registra pero no hay cobro).
   Es lo único entre la tienda actual y cobrar online de verdad.
3. **Dominio propio** — comprar en **NIC.ar** (directo, más barato) o **DonWeb** (ambos legítimos),
   conectarlo en Render → Settings → Custom Domains, y actualizar `NEXT_PUBLIC_SITE_URL`
   (se hornea en el build, así que al cambiarla Render redeploya solo).
4. **Descontar stock ya está**; falta activar email real (`RESEND_API_KEY`) cuando el cliente tenga dominio.
5. **SEO local:** Google Business Profile (lo más importante para una ferretería local) + Search Console.
6. **Antes de entregar al cliente:** cambiar la contraseña del admin desde "Mi cuenta" y cargar el
   QR de Data Fiscal AFIP (variable `site.afipQrUrl` en `lib/site.ts`).

### Seguridad
Se auditaron y cerraron los 38 hallazgos del relevamiento (ver historial de `auditoria-*`).
Entre otros: cabecera CSP (`next.config.mjs`), rate limit de login por IP y por cuenta
(`lib/login-limit.ts`), sesiones ligadas al hash de contraseña vigente para que un cambio de
clave invalide los tokens (`lib/auth.ts`, `lib/session-version.ts`), validación de subidas por
magic bytes y no por el MIME que declara el cliente, y verificación de email de clientes.
Cada server action y cada route handler del panel resuelve su propia sesión con
`getAdminSession()`: la protección no depende del middleware.

### Decisión de diseño (2026-07-06)
Se exploró una opción "Industrial Pro" (oscuro + amarillo seguridad) en una rama aparte y
**se descartó**: el cliente prefiere el diseño actual **naranja + slate**. La rama se borró.

---

## 🗂️ Estructura rápida

```
ferretodo/
├── apps/web/                # ⭐ La app (tienda + panel). Es el producto.
│   ├── app/(shop)/          #   tienda pública (home, catálogo, cuenta, legales, arrepentimiento)
│   ├── app/admin/           #   panel (pedidos, ventas, arrepentimientos, productos, portada, backup)
│   ├── app/checkout/        #   checkout (actions.ts = lógica server)
│   ├── components/          #   home, product, cart, catalog, admin, layout, account, legal
│   ├── lib/                 #   auth, customer-auth, secret, validation, backup, sales, email, etc.
│   ├── prisma/              #   esquema SQLite + migraciones + seed
│   ├── instrumentation*.ts  #   arranque en prod: bootstrap admin + backup diario
│   └── render.yaml (raíz)   #   blueprint de deploy en Render
├── apps/api/                # NestJS (Postgres) — PARKED, no se usa
├── packages/                # ui, types, config, db (varios parked)
└── docs/                    # blueprint (PRD, arquitectura, DB, roadmap)
```

---

## 🔌 Variables de entorno

Local en `apps/web/.env` (ver `apps/web/.env.example`). En producción se cargan en el dashboard de Render.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Base SQLite (local `file:./dev.db`; prod `file:/var/data/ferretodo.db`) |
| `AUTH_SECRET` | Firma de sesiones — obligatorio ≥32 chars en prod (Render lo genera) |
| `NEXT_PUBLIC_SITE_URL` | URL pública para SEO/sitemap (se hornea en build) |
| `UPLOADS_DIR` / `BACKUPS_DIR` | Carpetas en el disco persistente (prod `/var/data/...`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Crean el admin inicial en el primer arranque |
| `RESEND_API_KEY` / `EMAIL_FROM` / `STORE_EMAIL` | Emails (si falta la key, se simulan) |
| `TZ` | Zona horaria (prod `America/Argentina/Cordoba`) |

---

**Para continuar:** el próximo paso de mayor valor es **integrar Mercado Pago** (para cobrar de
verdad) o **conectar el dominio propio** + SEO local. La tienda ya está online y funcional.
