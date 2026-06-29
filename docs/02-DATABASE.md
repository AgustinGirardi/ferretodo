# 02 · DATABASE — Modelo de Datos

**Proyecto:** FERRETODO
**Motor:** PostgreSQL 16 · **ORM:** Prisma
**Versión:** 1.0 (Blueprint)

---

## 1. Principios de modelado

- **Multi-sucursal desde el día 1** (ADR-009): el stock vive en `InventoryItem` por `Branch`.
- **Pricing desacoplado**: el precio que ve un cliente depende de su `customerType` y de las `PriceList`. El producto guarda **costo + margen**; los precios se derivan o se fijan por lista.
- **Snapshots en operaciones**: `OrderItem` y `QuoteItem` congelan precio/nombre al momento — la inflación no reescribe el pasado.
- **Soft delete** donde importa (`deletedAt`) para no perder historia.
- **Auditoría** centralizada en `AuditLog`.
- **JSONB** para datos flexibles (especificaciones, dimensiones, metadatos).
- **Dinero**: `Decimal(12,2)` en ARS. Nunca floats para plata.

---

## 2. Diagrama entidad-relación (resumen textual)

```
User ──< Address
User ──1:1── Customer (perfil comercial B2B/B2C)
Customer ──> CustomerType ──< PriceList
Customer ──1:1── CreditAccount ──< CreditMovement

Category ──< Category (self, subcategorías)
Category ──< Product
Brand ──< Product
Supplier ──< Product
Product ──< ProductImage
Product ──< ProductMedia (video/pdf)
Product ──< ProductSpec
Product ──< PriceListItem >── PriceList
Product ──< InventoryItem >── Branch
Product ──< StockMovement
Product ──< ProductRelation >── Product (relacionados/similares/etc.)
Product ──< Review
Product ──< Question
Product ──< PriceHistory

Cart ──< CartItem >── Product
Order ──< OrderItem >── Product
Order ──1:1── Payment
Order ──1:1── Shipment
Order ──> Customer
Quote ──< QuoteItem >── Product
Quote ──> Customer  (Quote puede convertirse en Order)

Coupon, Promotion, Banner, Newsletter  (marketing)
Role ──< Permission (RBAC)  ·  User ──> Role
AuditLog  (transversal)
```

---

## 3. Esquema Prisma (núcleo del MVP)

> Vive en `packages/db/prisma/schema.prisma`. Se muestra el núcleo; enums y modelos de marketing al final.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pg_trgm, unaccent]   // búsqueda con typo-tolerance y sin acentos
}

// ───────────────────────────── IDENTIDAD Y ACCESO ─────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  emailVerified DateTime?
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  status        UserStatus @default(ACTIVE)

  roleId        String
  role          Role       @relation(fields: [roleId], references: [id])

  customer      Customer?            // perfil comercial (si es cliente)
  addresses     Address[]
  refreshTokens RefreshToken[]
  auditLogs     AuditLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([email])
  @@index([roleId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  userAgent String?
  ip        String?
  createdAt DateTime @default(now())

  @@index([userId])
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique         // Administrador, Empleado, Vendedor, Depósito, Contador, Cliente
  description String?
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
}

model Permission {
  id     String @id @default(cuid())
  // formato "recurso:accion" → producto:crear, pedido:editar, precio:actualizar_masivo
  code   String @unique
  roles  Role[]
}

model Address {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label      String?  // "Casa", "Obra Av. España"
  street     String
  number     String
  apartment  String?
  city       String
  province   String   @default("Córdoba")
  postalCode String
  reference  String?
  lat        Float?
  lng        Float?
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([userId])
}

// ───────────────────────────── CLIENTES (B2C / B2B) ─────────────────────────────

model CustomerType {
  id          String     @id @default(cuid())
  name        String     @unique  // Particular, Empresa, Constructor, Electricista, Gasista, Plomero, Arquitecto
  slug        String     @unique
  isBusiness  Boolean    @default(false) // muestra precios sin IVA, habilita Factura A
  priceLists  PriceList[]
  customers   Customer[]
  defaultDiscountPct Decimal @default(0) @db.Decimal(5,2)
  createdAt   DateTime   @default(now())
}

model Customer {
  id             String       @id @default(cuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerTypeId String
  customerType   CustomerType @relation(fields: [customerTypeId], references: [id])

  // datos fiscales (B2B / facturación AFIP)
  businessName   String?      // Razón social
  taxId          String?      // CUIT/CUIL
  taxCondition   TaxCondition @default(CONSUMIDOR_FINAL)

  birthday       DateTime?    // descuento de cumpleaños
  creditAccount  CreditAccount?
  orders         Order[]
  quotes         Quote[]
  reviews        Review[]
  questions      Question[]
  favorites      Favorite[]
  shoppingLists  ShoppingList[]

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([customerTypeId])
  @@index([taxId])
}

model CreditAccount {            // cuenta corriente B2B
  id          String           @id @default(cuid())
  customerId  String           @unique
  customer    Customer         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  creditLimit Decimal          @default(0) @db.Decimal(12,2)
  balance     Decimal          @default(0) @db.Decimal(12,2)  // positivo = debe
  movements   CreditMovement[]
  createdAt   DateTime         @default(now())
}

model CreditMovement {
  id          String        @id @default(cuid())
  accountId   String
  account     CreditAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  type        CreditMovementType   // CARGO (compra a cuenta) / PAGO
  amount      Decimal       @db.Decimal(12,2)
  description String?
  orderId     String?
  createdById String?       // empleado que registró
  createdAt   DateTime      @default(now())

  @@index([accountId])
}

// ───────────────────────────── CATÁLOGO ─────────────────────────────

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  icon        String?
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]
  position    Int        @default(0)
  isActive    Boolean    @default(true)
  // SEO
  metaTitle       String?
  metaDescription String?
  createdAt   DateTime   @default(now())

  @@index([parentId])
  @@index([slug])
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  logoUrl   String?
  isActive  Boolean   @default(true)
  products  Product[]
  createdAt DateTime  @default(now())

  @@index([slug])
}

model Supplier {
  id          String    @id @default(cuid())
  name        String
  taxId       String?
  email       String?
  phone       String?
  contactName String?
  notes       String?
  products    Product[]
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

model Product {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  internalCode    String?  @unique           // código interno
  barcode         String?  @unique           // código de barras (EAN)
  sku             String?  @unique

  brandId         String?
  brand           Brand?    @relation(fields: [brandId], references: [id])
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  supplierId      String?
  supplier        Supplier? @relation(fields: [supplierId], references: [id])

  shortDescription String?
  longDescription  String?   @db.Text
  specs            ProductSpec[]
  technicalData    Json?     // características técnicas flexibles

  // precios (base; el precio final lo resuelve el módulo pricing)
  basePrice        Decimal   @db.Decimal(12,2)   // precio de lista (Particular)
  previousPrice    Decimal?  @db.Decimal(12,2)   // precio anterior (tachado)
  cost             Decimal   @db.Decimal(12,2)   // costo
  marginPct        Decimal?  @db.Decimal(5,2)    // margen objetivo
  taxRate          Decimal   @default(21) @db.Decimal(5,2) // IVA %

  unit             ProductUnit @default(UNIT)    // unidad/metro/kg/bulto/litro
  unitsPerPack     Int?        // unidades por bulto/caja

  weightKg         Decimal?  @db.Decimal(10,3)
  dimensions       Json?     // { largo, ancho, alto } en cm

  status           ProductStatus @default(DRAFT)
  isFeatured       Boolean   @default(false)
  isNew            Boolean   @default(false)
  isOnSale         Boolean   @default(false)
  tags             String[]

  images           ProductImage[]
  media            ProductMedia[]
  inventory        InventoryItem[]
  stockMovements   StockMovement[]
  priceListItems   PriceListItem[]
  priceHistory     PriceHistory[]
  reviews          Review[]
  questions        Question[]

  relationsFrom    ProductRelation[] @relation("RelationFrom")
  relationsTo      ProductRelation[] @relation("RelationTo")

  // SEO
  metaTitle        String?
  metaDescription  String?

  ratingAvg        Decimal   @default(0) @db.Decimal(3,2)
  ratingCount      Int       @default(0)
  viewCount        Int       @default(0)
  salesCount       Int       @default(0)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?

  @@index([categoryId])
  @@index([brandId])
  @@index([status])
  @@index([isFeatured, isOnSale, isNew])
  // índice GIN para búsqueda full-text/trigram se crea por migración SQL (ver §5)
}

model ProductImage {
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url        String
  thumbUrl   String?
  alt        String?
  position   Int     @default(0)

  @@index([productId])
}

model ProductMedia {
  id        String    @id @default(cuid())
  productId String
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  type      MediaType // VIDEO, PDF
  url       String
  title     String?

  @@index([productId])
}

model ProductSpec {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String  // "Potencia", "Voltaje", "Material"
  value     String  // "750W", "220V", "Acero"
  position  Int     @default(0)

  @@index([productId])
}

model ProductRelation {
  id        String       @id @default(cuid())
  fromId    String
  from      Product      @relation("RelationFrom", fields: [fromId], references: [id], onDelete: Cascade)
  toId      String
  to        Product      @relation("RelationTo", fields: [toId], references: [id], onDelete: Cascade)
  type      RelationType // RELATED, SIMILAR, COMPLEMENTARY, BOUGHT_TOGETHER

  @@unique([fromId, toId, type])
  @@index([fromId])
}

model PriceHistory {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  price     Decimal  @db.Decimal(12,2)
  cost      Decimal? @db.Decimal(12,2)
  reason    String?  // "actualización masiva +12%", "import CSV"
  createdAt DateTime @default(now())

  @@index([productId, createdAt])
}

// ───────────────────────────── PRICING (LISTAS DE PRECIOS) ─────────────────────────────

model PriceList {
  id             String          @id @default(cuid())
  name           String          // "Mayorista Constructor", "Electricista"
  customerTypeId String?
  customerType   CustomerType?   @relation(fields: [customerTypeId], references: [id])
  discountPct    Decimal?        @db.Decimal(5,2) // descuento general vs basePrice
  isActive       Boolean         @default(true)
  items          PriceListItem[]
  createdAt      DateTime        @default(now())
}

model PriceListItem {
  id          String    @id @default(cuid())
  priceListId String
  priceList   PriceList @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  price       Decimal   @db.Decimal(12,2) // precio fijo para este producto en esta lista

  @@unique([priceListId, productId])
  @@index([productId])
}

// ───────────────────────────── INVENTARIO MULTI-SUCURSAL ─────────────────────────────

model Branch {
  id        String          @id @default(cuid())
  name      String          // "Casa Central - Río Cuarto"
  address   String?
  phone     String?
  isPickup  Boolean         @default(true)  // permite retiro
  isActive  Boolean         @default(true)
  inventory InventoryItem[]
  createdAt DateTime        @default(now())
}

model InventoryItem {
  id          String  @id @default(cuid())
  productId   String
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  branchId    String
  branch      Branch  @relation(fields: [branchId], references: [id], onDelete: Cascade)
  available   Int     @default(0)  // stock disponible
  reserved    Int     @default(0)  // stock reservado (órdenes en proceso)
  minStock    Int     @default(0)  // alerta de stock mínimo

  @@unique([productId, branchId])
  @@index([branchId])
}

model StockMovement {
  id          String         @id @default(cuid())
  productId   String
  product     Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  branchId    String
  type        StockMovementType // IN, OUT, ADJUST, RESERVE, RELEASE, TRANSFER
  quantity    Int
  reason      String?
  orderId     String?
  createdById String?
  createdAt   DateTime       @default(now())

  @@index([productId, createdAt])
}

// ───────────────────────────── CARRITO ─────────────────────────────

model Cart {
  id         String     @id @default(cuid())
  customerId String?    // null = invitado
  sessionId  String?    @unique // carrito anónimo
  items      CartItem[]
  couponCode String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  expiresAt  DateTime?

  @@index([customerId])
}

model CartItem {
  id         String   @id @default(cuid())
  cartId     String
  cart       Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId  String
  quantity   Int      @default(1)
  savedForLater Boolean @default(false)
  createdAt  DateTime @default(now())

  @@unique([cartId, productId])
}

// ───────────────────────────── PEDIDOS ─────────────────────────────

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique           // FT-2026-00001
  customerId    String?
  customer      Customer?   @relation(fields: [customerId], references: [id])

  // datos de invitado (compra sin cuenta)
  guestEmail    String?
  guestName     String?
  guestPhone    String?

  status        OrderStatus @default(PENDING)
  items         OrderItem[]

  subtotal      Decimal     @db.Decimal(12,2)
  discountTotal Decimal     @default(0) @db.Decimal(12,2)
  shippingCost  Decimal     @default(0) @db.Decimal(12,2)
  taxTotal      Decimal     @default(0) @db.Decimal(12,2)
  total         Decimal     @db.Decimal(12,2)

  couponCode    String?
  notes         String?

  payment       Payment?
  shipment      Shipment?
  quoteId       String?     @unique  // si provino de un presupuesto

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([customerId])
  @@index([status, createdAt])
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  // SNAPSHOT al momento de compra
  productName String
  sku         String?
  unitPrice   Decimal @db.Decimal(12,2)
  quantity    Int
  discount    Decimal @default(0) @db.Decimal(12,2)
  taxRate     Decimal @db.Decimal(5,2)
  lineTotal   Decimal @db.Decimal(12,2)

  @@index([orderId])
  @@index([productId])
}

model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  provider      PaymentProvider // MERCADOPAGO, TRANSFER, CASH, PICKUP
  status        PaymentStatus @default(PENDING)
  amount        Decimal       @db.Decimal(12,2)
  installments  Int?          // cuotas
  externalId    String?       // id en Mercado Pago
  rawPayload    Json?
  paidAt        DateTime?
  createdAt     DateTime      @default(now())

  @@index([externalId])
}

model Shipment {
  id            String       @id @default(cuid())
  orderId       String       @unique
  order         Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  method        ShipMethod   // PICKUP, DELIVERY
  branchId      String?      // para retiro
  addressJson   Json?        // dirección snapshot para envío
  zone          String?      // zona de Río Cuarto
  cost          Decimal      @default(0) @db.Decimal(12,2)
  estimatedDays Int?
  status        ShipStatus   @default(PENDING)
  trackingCode  String?
  createdAt     DateTime     @default(now())
}

// ───────────────────────────── PRESUPUESTOS ─────────────────────────────

model Quote {
  id          String      @id @default(cuid())
  quoteNumber String      @unique          // PRE-2026-00001
  customerId  String?
  customer    Customer?   @relation(fields: [customerId], references: [id])
  guestName   String?
  guestEmail  String?
  guestPhone  String?
  status      QuoteStatus @default(DRAFT)  // DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CONVERTED
  items       QuoteItem[]
  subtotal    Decimal     @db.Decimal(12,2)
  total       Decimal     @db.Decimal(12,2)
  validUntil  DateTime?
  pdfUrl      String?
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([customerId])
  @@index([status])
}

model QuoteItem {
  id          String  @id @default(cuid())
  quoteId     String
  quote       Quote   @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String
  productName String  // snapshot
  unitPrice   Decimal @db.Decimal(12,2)
  quantity    Int
  lineTotal   Decimal @db.Decimal(12,2)

  @@index([quoteId])
}

// ───────────────────────────── ENGAGEMENT ─────────────────────────────

model Favorite {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  productId  String
  createdAt  DateTime @default(now())

  @@unique([customerId, productId])
}

model ShoppingList {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  name       String   @default("Mi lista")
  itemsJson  Json     // [{ productId, quantity }]
  createdAt  DateTime @default(now())
}

model Review {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  rating     Int      // 1..5
  title      String?
  body       String?  @db.Text
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([productId, isApproved])
}

model Question {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  question   String
  answer     String?
  answeredAt DateTime?
  createdAt  DateTime @default(now())

  @@index([productId])
}

// ───────────────────────────── MARKETING ─────────────────────────────

model Coupon {
  id            String     @id @default(cuid())
  code          String     @unique
  type          CouponType // PERCENT, FIXED
  value         Decimal    @db.Decimal(12,2)
  minPurchase   Decimal?   @db.Decimal(12,2)
  maxUses       Int?
  usedCount     Int        @default(0)
  perUserLimit  Int?
  validFrom     DateTime?
  validUntil    DateTime?
  customerTypeId String?   // cupón exclusivo de un tipo de cliente
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
}

model Promotion {
  id          String        @id @default(cuid())
  name        String
  type        PromotionType // FLASH, COMBO, BUY_X_GET_Y, QTY_DISCOUNT, TRANSFER_DISCOUNT, BIRTHDAY
  config      Json          // parámetros según tipo
  startsAt    DateTime?
  endsAt      DateTime?     // para cuenta regresiva
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
}

model Banner {
  id        String   @id @default(cuid())
  title     String?
  imageUrl  String
  mobileUrl String?
  link      String?
  position  Int      @default(0)
  placement String   @default("hero") // hero, home_strip, category
  startsAt  DateTime?
  endsAt    DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model NewsletterSubscriber {
  id         String   @id @default(cuid())
  email      String   @unique
  isActive   Boolean  @default(true)
  source     String?
  createdAt  DateTime @default(now())
}

// ───────────────────────────── AUDITORÍA ─────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // "product.update", "price.bulk_update"
  entity     String?  // "Product"
  entityId   String?
  before     Json?
  after      Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([entity, entityId])
}

// ───────────────────────────── ENUMS ─────────────────────────────

enum UserStatus       { ACTIVE INACTIVE BANNED }
enum TaxCondition     { CONSUMIDOR_FINAL RESPONSABLE_INSCRIPTO MONOTRIBUTO EXENTO }
enum CreditMovementType { CARGO PAGO AJUSTE }
enum ProductStatus    { DRAFT ACTIVE PAUSED OUT_OF_STOCK ARCHIVED }
enum ProductUnit      { UNIT METER KILOGRAM LITER PACK SQUARE_METER }
enum MediaType        { VIDEO PDF }
enum RelationType     { RELATED SIMILAR COMPLEMENTARY BOUGHT_TOGETHER }
enum StockMovementType{ IN OUT ADJUST RESERVE RELEASE TRANSFER }
enum OrderStatus      { PENDING PAID PREPARING READY_FOR_PICKUP SHIPPED DELIVERED CANCELLED REFUNDED }
enum PaymentProvider  { MERCADOPAGO TRANSFER CASH PICKUP STRIPE PAYPAL MODO }
enum PaymentStatus    { PENDING APPROVED REJECTED REFUNDED IN_PROCESS }
enum ShipMethod       { PICKUP DELIVERY }
enum ShipStatus       { PENDING PREPARING SHIPPED DELIVERED }
enum QuoteStatus      { DRAFT SENT APPROVED REJECTED EXPIRED CONVERTED }
enum CouponType       { PERCENT FIXED }
enum PromotionType    { FLASH COMBO BUY_X_GET_Y QTY_DISCOUNT TRANSFER_DISCOUNT BIRTHDAY }
```

---

## 4. Resolución de precios (lógica clave B2B)

El precio que ve un cliente para un producto se calcula así (módulo `pricing`):

```
1. ¿Existe PriceListItem para (producto, lista del tipo de cliente)?
     → usar ese precio fijo.
2. Si no, ¿la PriceList tiene discountPct?
     → basePrice × (1 - discountPct/100).
3. Si no, usar CustomerType.defaultDiscountPct sobre basePrice.
4. Si es invitado/Particular → basePrice.
5. Aplicar promociones activas (flash, cantidad, transferencia, cumpleaños).
6. IVA: B2C ve precio final con IVA; B2B (isBusiness) ve neto + IVA discriminado.
```

Este cálculo se centraliza para que catálogo, carrito, checkout y presupuestos den **siempre el mismo número**.

---

## 5. Índices y búsqueda (migración SQL manual)

Prisma no expresa índices GIN/trigram, se agregan por migración:

```sql
-- Búsqueda full-text en español + tolerancia a errores
CREATE INDEX product_search_trgm_idx ON "Product"
  USING gin (
    (unaccent(lower(name)) || ' ' || coalesce(unaccent(lower("shortDescription")),'')) gin_trgm_ops
  );

CREATE INDEX product_fts_idx ON "Product"
  USING gin (to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce("shortDescription",'')));

CREATE INDEX product_barcode_idx ON "Product" (barcode);
CREATE INDEX order_created_idx   ON "Order" ("createdAt");
```

---

## 6. Integridad, transacciones y concurrencia

- **Reserva de stock**: al crear `Order`, en una transacción se decrementa `available` y se incrementa `reserved` con `StockMovement` tipo `RESERVE`. Si el pago falla/expira → `RELEASE`.
- **Cuenta corriente**: `CreditMovement` + actualización de `balance` siempre en la misma transacción.
- **Bloqueo optimista** en stock (chequear `available >= qty` dentro de la transacción) para evitar sobreventa.
- **Soft delete** (`deletedAt`) en `User` y `Product`; los reportes filtran por `deletedAt IS NULL`.

---

## 7. Seed inicial (dev)

`packages/db/prisma/seed.ts` carga: roles + permisos, tipos de cliente (Particular, Empresa, Constructor, Electricista, Gasista, Plomero, Arquitecto), 1 sucursal ("Casa Central - Río Cuarto"), categorías típicas de ferretería/corralón (Herramientas, Eléctrico, Plomería, Pinturería, Construcción, Ferretería, Jardín, Seguridad…), marcas comunes (Bosch, DeWalt, Sica, Tigre, Sherwin…), y ~50 productos demo con stock y precios.

---

Ver siguiente: [03-BACKEND.md](./03-BACKEND.md)
