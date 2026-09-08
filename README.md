# 🔧 FERRETODO — E-commerce autoadministrable para ferretería y corralón

Tienda online completa **y su panel de administración**, pensada para que el dueño de una
ferretería la gestione solo, sin tocar código: carga productos, edita la portada, sigue los
pedidos y descarga sus ventas desde el navegador.

**🟢 Demo en vivo:** https://ferretodo-m9dr.onrender.com · **Panel:** `/admin`

> Proyecto personal, construido de punta a punta: modelo de datos, backend, frontend, panel,
> despliegue y auditoría de seguridad. Los datos del catálogo son de demostración.

---

## 🏗️ Stack

Aplicación **full-stack en Next.js 15** (App Router): las mismas rutas sirven el HTML y
resuelven la lógica de negocio mediante server actions y route handlers. Sin API separada.

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, server actions) |
| Lenguaje | TypeScript |
| Base de datos | SQLite + Prisma ORM (migraciones versionadas) |
| Estilos | TailwindCSS + design system propio (`packages/ui`) |
| Estado de cliente | Zustand (carrito persistente) |
| Autenticación | JWT firmado con `jose`, cookies `httpOnly` · contraseñas con bcrypt |
| Emails | Resend (con modo simulado si no hay API key) |
| Imágenes | Subida al disco del servidor, optimizadas con `sharp` |
| Despliegue | Render (disco persistente para base, uploads y backups) |
| CI | GitHub Actions (typecheck + test + build) |

**¿Por qué SQLite?** Es un comercio único, con un volumen de pedidos que entra de sobra en un
archivo, y el requisito fuerte era **costo operativo cero**: sin servicio de base de datos
aparte, los backups son copiar un archivo. Prisma deja la puerta abierta a Postgres si hiciera
falta escalar a varias instancias.

---

## ✨ Funcionalidad

### Tienda
- Catálogo con filtros (categoría, marca, precio, ofertas, stock) y ordenamientos
- Buscador con autocompletado tolerante a acentos y navegación por teclado
- Ficha de producto con galería, cuotas, stock real, relacionados y JSON-LD para SEO
- Carrito persistente y checkout en tres pasos con validación de email, teléfono y zona
- **Descuento de stock transaccional** (a prueba de compras simultáneas), repuesto al cancelar
- Cuentas de cliente con verificación de email y login con Google opcional
- Emails de confirmación de pedido
- Tema claro/oscuro, diseño mobile-first
- Páginas legales: términos, privacidad, ayuda y botón de arrepentimiento (Res. 424/2020)

### Panel de administración
- ABM de productos, categorías y marcas, con subida de imágenes
- Gestión de pedidos con cambio de estado y detalle
- Editor de portada (banner, beneficios, destacados) sin tocar código
- Reporte de ventas exportable a CSV
- Backups automáticos diarios de la base (se conservan 14)
- Cambio de contraseña, que invalida las sesiones abiertas

---

## 🔒 Seguridad

Se relevaron y cerraron 38 hallazgos en dos pasadas de auditoría. Lo más relevante:

- **Cabecera CSP** y el resto de las cabeceras de seguridad en `next.config.mjs`
- **Rate limiting** de login por IP y por cuenta, con purga de entradas vencidas
- **Sesiones ligadas al hash de contraseña vigente**: cambiar la clave invalida los tokens emitidos
- **Validación de subidas por _magic bytes_**, no por el `Content-Type` que declara el cliente
- **Autorización en cada handler**: las 12 server actions y los route handlers del panel resuelven
  su propia sesión con `getAdminSession()`. La protección no depende del middleware.
- Sin credenciales por defecto en producción: el admin inicial se crea desde variables de entorno

---

## ▶️ Levantarlo en local

Requisitos: Node ≥ 20 y pnpm 10 (`corepack enable`).

```bash
git clone https://github.com/AgustinGirardi/ferretodo.git
cd ferretodo
pnpm install

cp apps/web/.env.example apps/web/.env    # completar AUTH_SECRET (32+ caracteres)

pnpm db:migrate     # crea la base SQLite y aplica las migraciones
pnpm db:seed        # catálogo de demo + usuario admin local
pnpm dev            # http://localhost:3000
```

Las credenciales del admin de desarrollo están en `apps/web/prisma/seed.ts`.
Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para el detalle de scripts y convenciones.

---

## 📦 Estructura

```
apps/web/            Next.js: tienda + panel admin + lógica de negocio
  app/(shop)/        Rutas públicas de la tienda
  app/admin/         Panel de administración
  lib/               Auth, sesiones, backups, rate limiting, emails
  prisma/            Schema, migraciones y seed
packages/ui/         Design system compartido
packages/config/     Presets de Tailwind y TypeScript
docs/                Blueprint original del proyecto
```

> ℹ️ Los documentos de [`/docs`](./docs) son el **blueprint inicial** y describen una
> arquitectura más ambiciosa (API separada, Postgres, Redis) que se simplificó
> deliberadamente durante la construcción. Se conservan como registro de las decisiones
> de diseño; la fuente de verdad sobre lo implementado es este README.

---

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).
