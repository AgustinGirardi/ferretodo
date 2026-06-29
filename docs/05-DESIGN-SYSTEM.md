# 05 · DESIGN SYSTEM — Diseño y Experiencia de Usuario

**Proyecto:** FERRETODO
**Versión:** 1.0 (Blueprint)
**Inspiración:** Apple (espacio/claridad) · Stripe/Vercel (admin) · Mercado Libre/Amazon (patrones de e-commerce que el usuario ya conoce)

---

## 1. Principios de diseño

1. **Confianza desde el primer segundo.** Precios claros, stock visible, cuotas, retiro en local, datos del negocio. El usuario tiene que sentir "esto es serio".
2. **Lo conocido vende.** En e-commerce no innovamos en patrones (carrito, filtros, checkout): usamos lo que el usuario argentino ya domina de Mercado Libre. Innovamos en velocidad, claridad y B2B.
3. **Mobile-first real.** La decisión se toma en el celular. Botones grandes, pulgar-friendly, sticky CTAs.
4. **Densidad correcta.** Tienda: aireada, mucho blanco. Admin: densa y eficiente.
5. **Premium sin fricción.** Glassmorphism y animaciones solo donde aportan; nunca a costa de velocidad o legibilidad.

---

## 2. Identidad de marca

Ferretería = **robustez + confianza + cercanía**. Paleta industrial pero moderna: un **naranja/ámbar** de herramienta como color de acción (energía, construcción) sobre **grises neutros** sólidos.

### Colores (tokens base)

```
/* Marca */
--brand-500: #F25C05;   /* naranja ferretería — acción principal */
--brand-600: #D94E04;   /* hover */
--brand-50:  #FFF3EB;   /* fondos suaves */

/* Neutros (slate) */
--neutral-50:  #F8FAFC;
--neutral-100: #F1F5F9;
--neutral-200: #E2E8F0;
--neutral-500: #64748B;
--neutral-700: #334155;
--neutral-900: #0F172A;

/* Semánticos */
--success: #16A34A;     /* en stock, pago aprobado */
--warning: #D97706;     /* bajo stock */
--danger:  #DC2626;     /* sin stock, error */
--info:    #2563EB;     /* informativo, cuotas */
--sale:    #DC2626;     /* precio oferta/descuento */
```

### Tokens semánticos (light / dark)

```
Light:  --bg #FFFFFF · --surface #F8FAFC · --fg #0F172A · --muted #64748B · --border #E2E8F0
Dark:   --bg #0B1120 · --surface #0F172A · --fg #F1F5F9 · --muted #94A3B8 · --border #1E293B
```

El **panel admin usa el tema dark por defecto** (estética Linear/Vercel); la tienda, light por defecto con toggle.

---

## 3. Tipografía

- **Display/headings:** `Inter` (o `Geist`) — moderna, legible, neutral.
- **Body:** misma familia, pesos 400/500/600.
- **Números/precios:** variante tabular (`font-feature-settings: "tnum"`) para que los precios alineen.

```
--font-sans: "Inter", system-ui, sans-serif;
Escala (rem):  xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3
Line-height:   tight 1.2 (headings) · normal 1.5 (body)
```

---

## 4. Espaciado, radios y sombras

```
/* Espaciado (escala 4px) */ 1=4 2=8 3=12 4=16 6=24 8=32 12=48 16=64 24=96

/* Radios */
--radius-sm: 6px · --radius-md: 10px · --radius-lg: 16px · --radius-xl: 24px · --radius-full: 9999px
(tarjetas: lg · botones: md · chips/badges: full)

/* Sombras (elegantes, suaves) */
--shadow-sm: 0 1px 2px rgba(15,23,42,.06)
--shadow-md: 0 4px 12px rgba(15,23,42,.08)
--shadow-lg: 0 12px 32px rgba(15,23,42,.12)
--shadow-brand: 0 8px 24px rgba(242,92,5,.25)   /* CTAs */
```

**Glassmorphism** (solo donde aporta: header sticky, FAB WhatsApp, modales sobre galería):
`background: rgba(255,255,255,.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.2)`.

---

## 5. Implementación (Tailwind + shadcn)

- Tokens como **CSS variables** en `:root` y `.dark`, mapeados en `tailwind.config` (`packages/config`).
- Componentes base de **shadcn/ui** (Radix: accesibles por defecto) + componentes de dominio en `packages/ui`.
- Modo oscuro vía `next-themes` (class strategy).
- Iconografía: **lucide-react**.

---

## 6. Componentes (catálogo del Design System)

### Primitivos (shadcn)
Button, Input, Select, Checkbox, Radio, Switch, Textarea, Dialog, Drawer/Sheet, Dropdown, Tooltip, Tabs, Accordion, Badge, Avatar, Toast (sonner), Skeleton, Pagination, Breadcrumb, Card, Table, Command (búsqueda).

### Variantes de Button
| Variante | Uso |
|---|---|
| `primary` (brand) | Agregar al carrito, Comprar |
| `secondary` | acciones alternativas |
| `outline` | filtros, terciarias |
| `ghost` | iconos, navegación |
| `destructive` | eliminar |
| `whatsapp` (verde) | acciones de WhatsApp |

Tamaños: `sm`, `md`, `lg`, `icon`. Estados: hover, focus-visible (anillo), loading, disabled. Touch target ≥ 44px en móvil.

### Componentes de dominio
- **ProductCard** — imagen 1:1, badge de descuento/novedad, marca, nombre (2 líneas), `PriceTag`, cuotas, `StockBadge`, botón "Agregar". Hover: leve elevación.
- **PriceTag** — precio actual grande, anterior tachado, % off, "X cuotas sin interés".
- **StockBadge** — verde "En stock" / ámbar "Últimas unidades" / rojo "Sin stock".
- **ProductGallery** — principal + miniaturas + zoom + video; 360° preparado.
- **WhatsAppFAB** — botón flotante verde, sticky, con tooltip.
- **CountdownTimer** — ofertas flash.
- **CartDrawer** — mini-carrito lateral.
- **CheckoutStepper** — pasos del checkout.
- **B2BPriceBlock** — precio neto + IVA + "tu lista: Electricista".
- **FilterSidebar / SortSelect**, **RatingStars**, **Breadcrumbs**, **EmptyState**, **Skeletons**.

---

## 7. Layout y grillas

- **Container:** máx 1280px (tienda), full-width fluido en admin.
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- **Grid de productos:** 2 col (móvil) → 3 (sm) → 4 (lg) → 5 (xl).
- **Header tienda:** barra utilitaria (teléfono/horario) + barra principal (logo, buscador, cuenta, carrito) + barra de categorías. Sticky con glass al hacer scroll.

---

## 8. Wireframes (esquemáticos, baja fidelidad)

### Home (móvil)
```
┌───────────────────────────┐
│ 0351-000-0000 · Lun-Vie... │  barra utilitaria
├───────────────────────────┤
│ ☰  FERRETODO   🔍  👤  🛒 │  header sticky
├───────────────────────────┤
│ [ 🔍 Buscar productos... ] │  buscador prominente
├───────────────────────────┤
│ ███████ HERO BANNER ██████ │
│        CTA Ver ofertas     │
├───────────────────────────┤
│ Categorías                 │
│ [🔨][⚡][🚰][🎨][🧱][🌿] │  grid scrollable
├───────────────────────────┤
│ ⏱ OFERTAS FLASH  02:14:33 │
│ [card][card][card] →       │
├───────────────────────────┤
│ Más vendidos               │
│ [card][card][card] →       │
├───────────────────────────┤
│ Marcas  [logo][logo][logo] │
├───────────────────────────┤
│ ✅ Envío  ✅ Cuotas  ✅... │  beneficios
├───────────────────────────┤
│ 📍 Mapa · Contacto · FAQ   │
├───────────────────────────┤
│ Footer + Newsletter        │
└───────────────────────────┘
                    [ 🟢 WhatsApp ]  FAB
```

### Ficha de producto (móvil)
```
┌───────────────────────────┐
│ ← Volver         🔍 🛒     │
├───────────────────────────┤
│ ███ Galería HD (swipe) ███ │
│  • • ○ ○      [🔍 zoom]    │
├───────────────────────────┤
│ Marca Bosch                │
│ Taladro Percutor GSB 13 RE │
│ ★★★★☆ (124)               │
│ $89.999  ̶$̶1̶1̶9̶.̶9̶9̶9̶  -25%  │
│ 12 cuotas sin interés      │
│ 🟢 En stock · Retiro hoy   │
├───────────────────────────┤
│ [  Agregar al carrito   ]  │
│ [   Comprar ahora       ]  │
│ ♡ Favorito   ⤴ Compartir  │
│ [ 🟢 Consultar x WhatsApp ]│
├───────────────────────────┤
│ Descripción│Especif.│Opin. │  tabs
├───────────────────────────┤
│ Comprados juntos →         │
│ Relacionados →             │
└───────────────────────────┘
  [sticky] $89.999 [Agregar 🛒]
```

### Checkout (flujo único)
```
┌───────────────────────────────────────┐
│ FERRETODO   🔒 Compra segura          │
├──────────────────────┬────────────────┤
│ ① Datos          ✓   │  RESUMEN        │
│ ② Entrega        ●   │  3 productos    │
│   ◉ Retiro local     │  Subtotal $...  │
│   ○ Envío (zona)     │  Envío    $...  │
│ ③ Pago               │  Desc.   -$...  │
│   ◉ Mercado Pago     │  ─────────────  │
│   ○ Transferencia    │  TOTAL   $...   │
│   ○ Efectivo/retiro  │                 │
│ ④ Confirmar          │  [ Pagar ]      │
└──────────────────────┴────────────────┘
```

### Panel admin — Dashboard (desktop, dark)
```
┌──────┬────────────────────────────────────────────┐
│ LOGO │ Dashboard            🔔  🌙  Admin ▾        │
│      ├────────────────────────────────────────────┤
│ 📊   │ [Ventas hoy] [Mes] [Ticket prom] [Conv.]   │  stat cards
│ 📦   │ ┌──────────────┐ ┌──────────────────────┐  │
│ 🏷   │ │ Ventas (línea)│ │ Top productos (barras)│ │
│ 📥   │ └──────────────┘ └──────────────────────┘  │
│ 👥   │ Últimos pedidos                            │
│ 🎟   │ ┌────────────────────────────────────────┐ │
│ ⚙    │ │ #FT-00123  Juan P.  $45.000  PAGADO   │ │
│      │ │ #FT-00122  Constr.  $230.000 PREPAR.  │ │
│      │ └────────────────────────────────────────┘ │
└──────┴────────────────────────────────────────────┘
```

---

## 9. Estados y feedback

- **Loading:** skeletons (nunca spinners en listados); barras de progreso en jobs admin.
- **Vacío:** `EmptyState` con ilustración + CTA ("Tu carrito está vacío → Ver ofertas").
- **Error:** mensaje claro + acción de reintento; nunca stack traces.
- **Éxito:** toasts (sonner) + confirmaciones visuales (agregado al carrito).

---

## 10. Tono y voz

Cercano, claro, argentino, profesional. Sin tecnicismos innecesarios. Ejemplos:
- CTA: "Agregar al carrito", "Comprar ahora", "Pedir presupuesto".
- Confianza: "Retirá hoy en el local", "12 cuotas sin interés", "Envíos en Río Cuarto".
- Errores: "No pudimos procesar el pago. Probá de nuevo o elegí otro medio."

---

Ver siguiente: [06-ROADMAP.md](./06-ROADMAP.md)
