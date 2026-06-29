# 00 · PRD — Product Requirements Document

**Proyecto:** FERRETODO — Plataforma de E-commerce para Ferretería y Corralón
**Versión:** 1.0 (Blueprint)
**Fecha:** 2026-06-28
**Autor:** Equipo de Producto (CEO · PM · Arquitecto)
**Estado:** Pendiente de aprobación

---

## 1. Resumen ejecutivo

FERRETODO es la plataforma de e-commerce de una ferretería y corralón de Río Cuarto (Córdoba) que combina lo mejor de Mercado Libre, Amazon y Home Depot, **adaptado a la realidad argentina y al rubro ferretero**.

No es una tienda online genérica. Es un sistema de ventas omnicanal (web + WhatsApp + mostrador) con un fuerte componente **B2B** (contratistas, empresas, gremios) además del **B2C** tradicional, diseñado para escalar a múltiples sucursales y, eventualmente, a un marketplace con vendedores externos.

### Problema que resolvemos

| Actor | Dolor hoy | Cómo lo resolvemos |
|---|---|---|
| Cliente particular | No sabe si hay stock, tiene que ir o llamar | Catálogo con stock en tiempo real, compra online, retiro o envío |
| Contratista / gremio | Pide precios por WhatsApp, espera presupuesto manual | Lista de precios propia, presupuesto self-service en PDF, repetir compra, cuenta corriente |
| Dueño / mostrador | Pierde tiempo en consultas repetidas y presupuestos | Automatización de catálogo, presupuestos y pedidos; menos llamados |
| Administración | Actualizar precios con inflación es un infierno | Actualización masiva por costo+margen, import CSV/Excel |

### Métrica norte (North Star)

**Ingreso mensual generado a través de canales digitales** (web + presupuestos + carritos enviados por WhatsApp que terminan en venta).

---

## 2. Objetivos y métricas de éxito

### Objetivos de negocio

1. Aumentar las ventas totales captando demanda online que hoy se pierde.
2. Reducir el trabajo manual de mostrador (consultas de stock/precio, presupuestos).
3. Fidelizar al cliente B2B con herramientas que lo hagan comprar siempre en FERRETODO.
4. Construir base de datos de clientes para marketing (newsletter, push, remarketing).

### KPIs por categoría

| Categoría | KPI | Meta inicial (6 meses post-launch) |
|---|---|---|
| Adquisición | Visitas mensuales únicas | 10.000+ |
| Conversión | Tasa de conversión B2C | ≥ 1,5% |
| Conversión | Presupuestos B2B generados/mes | 200+ |
| Ticket | Ticket promedio B2C / B2B | Medir y crecer 10% trimestral |
| Retención | Clientes B2B recurrentes | ≥ 60% recompra a 90 días |
| Operación | % pedidos sin intervención manual | ≥ 70% |
| Carrito | Tasa de abandono de carrito | < 70% (recuperar 10%) |
| Performance | LCP móvil / CLS | < 2,5s / < 0,1 |

---

## 3. Usuarios y personas

### B2C — Consumidor final

**"Marcelo, 38, arregla cosas en su casa."** Entra desde el celular, busca "taladro percutor", compara precios y cuotas, quiere saber si puede retirar hoy. Decide por precio, cuotas y confianza.

### B2B — Profesionales (el corazón del negocio)

Cada tipo tiene **lista de precios y descuentos propios**:

- **Constructor / Empresa constructora** — compra materiales gruesos (corralón), volumen alto, necesita Factura A y a veces cuenta corriente.
- **Electricista** — cables, llaves, térmicas; recompra frecuente del mismo set.
- **Gasista** — caños, fittings, termofusión.
- **Plomero** — sanitarios, PVC, grifería.
- **Arquitecto / Estudio** — especifica materiales, genera presupuestos para sus obras.
- **Empresa** (genérico) — compra para mantenimiento, requiere comprobantes fiscales.

### Interno — Equipo FERRETODO

- **Administrador** — control total.
- **Empleado / Vendedor** — gestiona pedidos, presupuestos, clientes.
- **Depósito** — stock, movimientos, preparación de pedidos.
- **Contador** — reportes financieros, facturación (solo lectura de operación).

---

## 4. Alcance del MVP (aprobado)

El MVP incluye **los cuatro pilares** (decisión del cliente):

### Pilar 1 — Catálogo + Carrito + Checkout (B2C)
- Home con hero, categorías, ofertas, destacados, novedades, más vendidos, marcas, beneficios, mapa, contacto.
- Catálogo con categorías/subcategorías, marcas, filtros (precio, marca, stock, oferta, novedades, categoría) y orden (más vendidos, novedades, precio ↑↓, mayor descuento).
- Buscador con autocompletado, tolerancia a errores y sinónimos (Postgres FTS + pg_trgm).
- Ficha de producto: galería HD con zoom, precio/precio anterior/descuento, stock, entrega estimada, retiro en local, comprar / agregar al carrito / comprar ahora, favoritos, compartir, relacionados/similares, especificaciones.
- Carrito: modificar cantidades, eliminar, guardar para después, sugeridos (cross/up-sell), cálculo de envío y total.
- Checkout en un flujo: datos → dirección → entrega → pago → confirmación. Invitado o con cuenta.
- **Pagos:** Mercado Pago (Checkout Pro con cuotas), transferencia (con descuento), efectivo / pago al retirar.
- **Envíos:** retiro en local + envío con costo por zona de Río Cuarto.
- Emails transaccionales (confirmación de pedido, cambios de estado) vía Resend.

### Pilar 2 — WhatsApp + Presupuestos
- Botón flotante de WhatsApp (consultar producto, enviar carrito, solicitar presupuesto, compartir).
- Generador de presupuestos: el cliente arma un presupuesto, lo descarga en **PDF** y lo envía por WhatsApp/email.
- El administrador puede **aprobar/editar** presupuestos y convertirlos en pedido.

### Pilar 3 — B2B (listas de precios + cuenta corriente)
- Tipos de cliente con **listas de precios y descuentos diferenciados**.
- Precios netos sin IVA visibles para B2B, datos fiscales (CUIT, condición IVA) en el perfil.
- **Cuenta corriente** (saldo, límite de crédito, movimientos) — gestión manual de pagos en MVP.
- Repetir compra y lista de compras.

### Pilar 4 — Panel Admin (productos / stock / pedidos)
- Dashboard con métricas base.
- CRUD de productos (con todos los campos del modelo), duplicar, estados.
- **Actualización masiva de precios** (por costo+margen, por marca, por categoría, %).
- **Actualización masiva de stock.**
- **Importar/Exportar** productos vía CSV/Excel.
- Gestión de categorías, subcategorías, marcas, proveedores.
- Gestión de pedidos (estados, preparación) y clientes.
- Gestión de usuarios internos, roles y permisos.
- Auditoría de acciones (quién, qué, cuándo).
- 2FA para administradores.

### Fuera del MVP (fases posteriores)
Búsqueda semántica con IA, recomendaciones con IA, recuperación automática de carritos abandonados, multi-sucursal, facturación AFIP automática, push, marketplace externo, app móvil, integraciones ERP/CRM, shops sociales, vista 360°, historial de precios público. (Ver [06-ROADMAP.md](./06-ROADMAP.md).)

---

## 5. Requisitos funcionales (resumen por dominio)

> El detalle accionable está en [07-TASKS.md](./07-TASKS.md). Aquí el "qué", no el "cómo".

### 5.1 Catálogo
- Productos con campos completos (ver [02-DATABASE.md](./02-DATABASE.md)): nombre, código interno, código de barras, SKU, marca, categoría, subcategoría, proveedor, descripciones, especificaciones, precios (actual/anterior/costo/margen), stock (disponible/reservado/mínimo), peso, dimensiones, **unidad de medida** (unidad/metro/kg/bulto), imágenes múltiples, video, PDF, etiquetas, estado, relaciones (relacionados/similares/complementarios/comprados-juntos), flags (destacado/nuevo/oferta).
- Categorías y subcategorías jerárquicas; marcas; proveedores.

### 5.2 Búsqueda y descubrimiento
- Búsqueda por nombre, marca, código, código de barras, descripción, categoría, etiquetas.
- Autocompletado, corrección de errores, sinónimos.
- Filtros y ordenamientos (ver MVP §4).
- "Últimos vistos", recomendados.

### 5.3 Clientes
- Registro, login, recuperación de contraseña, perfil, direcciones, favoritos, historial, repetir compra, lista de compras, lista de deseos, facturas, presupuestos.
- Tipos de cliente con precios/descuentos diferenciados.

### 5.4 Carrito y checkout
- Persistencia de carrito (anónimo y logueado), merge al iniciar sesión.
- Checkout invitado y con cuenta; cálculo de envío y total; cross/up-sell.

### 5.5 Pagos y envíos
- Mercado Pago, transferencia, efectivo/retiro (MVP). Stripe/PayPal/MODO preparados.
- Retiro en local; envío con costo por zona; tiempo estimado.

### 5.6 Presupuestos
- Generación self-service, PDF, envío por WhatsApp/email, aprobación del admin, conversión a pedido.

### 5.7 Marketing
- Cupones, ofertas flash con cuenta regresiva, combos, 2x1, descuentos por cantidad, descuento por transferencia, descuento por cumpleaños, newsletter, cross/up-sell, recomendados, últimos vistos.

### 5.8 Administración
- Todo lo del MVP §4 (Pilar 4), más promociones, banners, cupones, descuentos, sucursales (modelado), métodos de envío/pago.

### 5.9 Dashboard y analítica
- Ventas (día/mes/año), facturación, ganancias, ticket promedio, top productos/categorías/marcas, clientes nuevos/frecuentes, productos sin movimiento, conversión, visitas, abandono de carrito, comparación mensual, gráficos interactivos.

### 5.10 Auditoría y permisos
- Registro de todas las acciones administrativas (quién, qué, cuándo, desde dónde).
- Roles: Administrador, Empleado, Vendedor, Depósito, Contador, Cliente — con permisos granulares e independientes.

---

## 6. Requisitos no funcionales

| Atributo | Requisito |
|---|---|
| **Performance** | LCP < 2,5s móvil; CWV en verde; SSR/ISR; lazy loading; code splitting; cache; imágenes optimizadas; skeletons; Lighthouse objetivo 90+ |
| **Escalabilidad** | Miles de productos y clientes; arquitectura modular lista para multi-sucursal y app móvil |
| **Seguridad** | Protección SQLi/XSS/CSRF; rate limit; captcha; 2FA admin; encriptación; validaciones; roles/permisos; backups; logs (ver [08-SECURITY.md](./08-SECURITY.md)) |
| **Disponibilidad** | 99,5%+; backups diarios con recuperación probada |
| **Accesibilidad** | WCAG 2.1 AA; navegación por teclado; contraste; alt text; lectores de pantalla |
| **SEO** | Meta dinámicos, OG, Twitter Cards, Schema.org, sitemap, robots, breadcrumbs, URLs amigables, rich snippets, Google Shopping |
| **Mantenibilidad** | Clean Architecture, SOLID, DRY, KISS, DDD-light, tests, docs, CI/CD |
| **i18n / moneda** | Español (AR), pesos argentinos, manejo de inflación (precios por costo+margen) |
| **Mobile** | Mobile-first; tablet; desktop |

---

## 7. Supuestos, restricciones y riesgos

### Supuestos
- El cliente cargará el catálogo inicial (o lo importamos por CSV desde su sistema actual).
- Existe una cuenta de Mercado Pago del negocio para cobros.
- WhatsApp se opera al inicio con `wa.me` (link); WhatsApp Business API queda para fase posterior.

### Restricciones
- Presupuesto y tiempo: priorizar MVP que venda antes que features "wow".
- Facturación AFIP: integración compleja → fase 2/3; en MVP se emiten comprobantes manualmente.

### Riesgos principales
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Catálogo no cargado a tiempo | Alto | Importador CSV robusto desde el inicio; carga asistida |
| Inflación desactualiza precios | Alto | Actualización masiva por costo+margen; alertas |
| Sobre-alcance del MVP (4 pilares) | Medio | Roadmap estricto; cada pilar con corte mínimo viable |
| Dependencia de Mercado Pago | Medio | Abstracción `PaymentProvider`; transferencia/efectivo como respaldo |
| Fraude / contracargos | Medio | Validaciones, captcha, reglas anti-fraude básicas |

---

## 8. Métricas de adopción y analítica

- GA4 + Google Tag Manager + Meta Pixel (instrumentación desde fase 1, activación según consentimiento).
- Eventos clave: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `generate_quote`, `whatsapp_click`, `search`.
- Embudo B2C y embudo B2B medidos por separado.

---

## 9. Criterios de aceptación del MVP (Definition of Done)

El MVP se considera listo para producción cuando:

- [ ] Un cliente B2C puede buscar, agregar al carrito y comprar con Mercado Pago, eligiendo retiro o envío.
- [ ] Un cliente B2B logueado ve **sus** precios y puede generar un presupuesto en PDF y enviarlo por WhatsApp.
- [ ] El botón de WhatsApp permite consultar un producto y "enviar carrito".
- [ ] El admin puede cargar/editar productos, actualizar precios y stock de forma masiva, e importar por CSV.
- [ ] El admin gestiona pedidos y ve un dashboard con ventas del día/mes.
- [ ] 2FA activo para admins; auditoría registrando acciones.
- [ ] SEO base (meta, sitemap, schema), CWV en verde en móvil, accesibilidad AA en flujos críticos.
- [ ] Backups automáticos configurados y restauración probada al menos una vez.
- [ ] Suite de tests (unit + integración de dominios críticos + E2E de compra) en verde en CI.

---

Ver siguiente: [01-ARCHITECTURE.md](./01-ARCHITECTURE.md)
