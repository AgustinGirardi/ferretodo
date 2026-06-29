# 04 · FRONTEND — Especificación del Frontend

**Proyecto:** FERRETODO
**Stack:** Next.js 15 (App Router) · React · TypeScript · TailwindCSS · shadcn/ui · Framer Motion
**Versión:** 1.0 (Blueprint)

---

## 1. Estrategia general

- **App Router** con React Server Components por defecto; Client Components solo donde hay interactividad/estado.
- **Mobile-first** siempre. Diseño responsive: móvil → tablet → desktop.
- **Rendering por tipo de página:**
  - Home, categorías, fichas de producto → **ISR** (rápidas y SEO-friendly, revalidación por tag al editar).
  - Resultados de búsqueda/filtros → render dinámico con cache corto.
  - Carrito, checkout, cuenta, panel admin → **dinámico/CSR** (privado, sin cache).
- **Datos:** Server Components fetchean del API NestJS en el server; en cliente, **TanStack Query** para mutaciones e interactividad (carrito, filtros).
- **Estado:** Zustand para UI/carrito local; TanStack Query para estado de servidor. Nada de Redux.

---

## 2. Estructura de rutas

```
app/
├── (shop)/                      # tienda pública — layout con header/footer
│   ├── page.tsx                 # HOME
│   ├── productos/
│   │   ├── page.tsx             # catálogo (filtros, orden, paginación/scroll)
│   │   └── [slug]/page.tsx      # ficha de producto
│   ├── categoria/[slug]/page.tsx
│   ├── marca/[slug]/page.tsx
│   ├── buscar/page.tsx          # resultados de búsqueda
│   ├── carrito/page.tsx
│   ├── checkout/page.tsx        # flujo único de compra
│   ├── presupuesto/page.tsx     # generador de presupuesto
│   ├── ofertas/page.tsx
│   ├── contacto/page.tsx
│   └── ayuda/page.tsx           # FAQ, envíos, cómo comprar
├── (account)/                   # área del cliente (auth)
│   ├── cuenta/page.tsx
│   ├── cuenta/pedidos/page.tsx
│   ├── cuenta/presupuestos/page.tsx
│   ├── cuenta/favoritos/page.tsx
│   ├── cuenta/listas/page.tsx
│   ├── cuenta/direcciones/page.tsx
│   ├── cuenta/cuenta-corriente/page.tsx   # B2B
│   └── cuenta/datos/page.tsx
├── (auth)/
│   ├── login/page.tsx
│   ├── registro/page.tsx
│   └── recuperar/page.tsx
├── admin/                       # PANEL ADMIN (layout propio, dark por defecto)
│   ├── page.tsx                 # dashboard
│   ├── productos/...            # listado, crear, editar, importar
│   ├── stock/...
│   ├── pedidos/...
│   ├── presupuestos/...
│   ├── clientes/...
│   ├── categorias/, marcas/, proveedores/
│   ├── promociones/, cupones/, banners/
│   ├── usuarios/, roles/
│   ├── sucursales/
│   ├── auditoria/
│   └── configuracion/
├── api/                         # route handlers / BFF (proxy auth, webhooks front)
├── sitemap.ts · robots.ts · manifest.ts
└── layout.tsx                   # root: theme provider, fonts, analytics
```

---

## 3. Pantallas clave y su comportamiento

### 3.1 Home (`/`)
Secciones (en orden, todas lazy debajo del fold):
1. **Header** sticky: logo, buscador prominente, categorías, cuenta, carrito. Barra superior con teléfono/horario/"Envíos en Río Cuarto".
2. **Hero banner** (carrusel administrable, imagen móvil separada).
3. **Categorías** en grid con íconos.
4. **Ofertas / Ofertas Flash** con cuenta regresiva.
5. **Productos destacados**, **Novedades**, **Más vendidos** (carruseles).
6. **Marcas** (logos).
7. **Beneficios** (envío, retiro, cuotas, atención).
8. **Opiniones** / pruebas sociales.
9. **FAQ** + **Mapa** (ubicación) + **Contacto**.
10. **Footer** completo (links, horario, redes, newsletter).

### 3.2 Catálogo (`/productos`, `/categoria/[slug]`)
- Sidebar de **filtros** (precio, marca, stock, oferta, novedades, categoría, calificación) — drawer en móvil.
- **Orden:** más vendidos, novedades, precio ↑↓, mejor calificados, mayor descuento.
- **Grid de tarjetas** con imagen, nombre, marca, precio, precio anterior, % descuento, cuotas, stock, botón rápido "Agregar".
- **Paginación** + opción **infinite scroll** en móvil; URL refleja filtros (compartible, SEO).
- **Skeletons** durante carga.

### 3.3 Ficha de producto (`/productos/[slug]`)
- **Galería HD** con zoom (hover/pinch), miniaturas, video; vista 360° preparada.
- Panel de compra: precio, precio anterior, descuento, **cuotas (Mercado Pago)**, stock, entrega estimada, retiro en local.
- Botones: **Agregar al carrito**, **Comprar ahora**, favoritos, compartir, **WhatsApp "consultar"**.
- Para **B2B logueado**: muestra **su** precio (neto + IVA) y botón "Agregar a presupuesto".
- Tabs: descripción larga, especificaciones, opiniones, preguntas.
- Secciones: relacionados, similares, **comprados juntos**, últimos vistos.
- **Sticky bar** de compra en móvil al hacer scroll.

### 3.4 Carrito (`/carrito`)
- Lista editable (cantidad, eliminar, **guardar para después**).
- Resumen con subtotal, descuentos, envío (estimado por zona), total.
- **Sugeridos / cross-sell / up-sell**.
- CTAs: **Iniciar compra**, **Generar presupuesto**, **Enviar por WhatsApp**.

### 3.5 Checkout (`/checkout`) — flujo único
Pasos en una sola página (acordeón/stepper): **Datos → Dirección/Entrega → Pago → Confirmación**.
- Invitado o con cuenta (no obligar a registrarse).
- Entrega: retiro en local o envío (calcula costo por zona).
- Pago: Mercado Pago (cuotas), transferencia (con descuento), efectivo/al retirar.
- Validación inline, resumen siempre visible, sin distracciones (header minimal).

### 3.6 Generador de presupuesto (`/presupuesto`)
- Arma lista de ítems (desde carrito o agregando), muestra precios del cliente.
- **Descargar PDF**, **enviar por WhatsApp/email**, guardar en cuenta.

### 3.7 Panel admin (`/admin`)
- Estética **Stripe/Linear/Vercel**, **dark por defecto**, denso y rápido.
- Dashboard con gráficos (ventas día/mes/año, ticket, top productos, conversión, abandono).
- Tablas con orden/filtro/búsqueda/selección masiva; formularios con validación; uploads drag&drop.
- Editor de producto con todos los campos, **gestión de imágenes** (drag&drop, reordenar, recortar), relaciones.
- Importador CSV/Excel con preview y reporte de errores; barra de progreso de jobs.

---

## 4. Sistema de componentes

Base en `packages/ui` (shadcn/ui + componentes propios). Catálogo en [05-DESIGN-SYSTEM.md](./05-DESIGN-SYSTEM.md).

**Componentes de dominio (propios):**
`ProductCard`, `ProductGallery`, `PriceTag` (precio+anterior+cuotas), `StockBadge`, `AddToCartButton`, `QuantityStepper`, `FilterSidebar`, `SortSelect`, `RatingStars`, `WhatsAppFAB`, `CountdownTimer`, `CartDrawer`, `CheckoutStepper`, `QuoteBuilder`, `B2BPriceBlock`, `CategoryGrid`, `BrandStrip`, `Breadcrumbs`, `EmptyState`, `SkeletonCard`.

**Admin:** `DataTable`, `StatCard`, `ChartCard`, `BulkActionBar`, `ImageUploader`, `CsvImporter`, `FormSection`, `AuditTrail`.

---

## 5. Estado y datos

| Necesidad | Solución |
|---|---|
| Carrito (anónimo + logueado) | Zustand + persistencia + sync con API; merge al loguear |
| Datos de servidor (productos, pedidos) | TanStack Query (cache, revalidación, optimistic updates) |
| Auth en cliente | Cookie httpOnly + hook `useSession`; refresh transparente |
| Filtros de catálogo | Estado en URL (searchParams) → compartible y SEO |
| Tema claro/oscuro | `next-themes` |
| Formularios | React Hook Form + Zod (mismos esquemas que el back vía `packages/types`) |
| Notificaciones UI | `sonner` (toasts) |

---

## 6. Performance (objetivo CWV en verde)

- `next/image` con Cloudinary loader; `priority` solo en hero/LCP; `sizes` correctos.
- **Code splitting** por ruta; `dynamic()` para componentes pesados (galería, gráficos admin).
- **Lazy load** de secciones below-the-fold y de scripts de marketing (cargar tras interacción/consent).
- **ISR** + `revalidateTag` para no rebuildear todo.
- Fuentes con `next/font` (self-hosted, sin layout shift).
- **Skeletons** y **streaming** (Suspense) para TTFB percibido bajo.
- Prefetch de links en viewport.
- Presupuesto de performance: JS inicial < 200KB gzip en home.
- **Lighthouse objetivo 90+** (100 es ideal pero los scripts de tracking lo limitan; priorizamos CWV reales).

---

## 7. SEO técnico (front)

- **Metadata API** de Next: títulos/descripciones dinámicos por producto/categoría.
- **Open Graph** + **Twitter Cards** por página.
- **Schema.org** JSON-LD: `Product` (precio, stock, rating), `BreadcrumbList`, `Organization`, `LocalBusiness` (FERRETODO Río Cuarto), `FAQPage`.
- **Sitemap** dinámico (`sitemap.ts`) + **robots.ts**.
- **URLs amigables** (`/categoria/herramientas-electricas`, `/productos/taladro-bosch-gsb-13-re`).
- **Breadcrumbs** visibles + estructurados.
- Feed para **Google Shopping** (fase posterior, datos ya disponibles).

---

## 8. Accesibilidad (WCAG 2.1 AA)

- HTML semántico, landmarks, foco visible, navegación por teclado completa.
- Contraste AA en todos los textos (validado en design tokens).
- `alt` en imágenes de producto; labels en formularios; `aria-*` en componentes interactivos.
- Compatibilidad con lectores de pantalla en flujos críticos (buscar, agregar al carrito, checkout).
- Respeto a `prefers-reduced-motion` en animaciones Framer Motion.

---

## 9. Animaciones y microinteracciones (Framer Motion)

- Transiciones suaves (no gratuitas): hover de tarjetas, agregar al carrito (vuelo al ícono), apertura de drawers, stepper de checkout.
- Microinteracciones en botones, favoritos (corazón), countdown de ofertas.
- Siempre con `prefers-reduced-motion` y sin penalizar CWV.

---

## 10. PWA / preparación móvil

- `manifest.ts` + íconos → instalable.
- Service worker para cache de assets y modo offline básico del catálogo (fase posterior).
- Diseño y API ya compatibles con futura app nativa (Expo) que reusa `packages/types`.

---

Ver siguiente: [05-DESIGN-SYSTEM.md](./05-DESIGN-SYSTEM.md)
