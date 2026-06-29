import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "product:create", "product:edit", "product:delete", "product:import",
  "price:bulk_update", "stock:bulk_update",
  "order:view", "order:edit",
  "quote:approve",
  "customer:view", "customer:edit",
  "user:manage", "role:manage",
  "audit:view", "dashboard:view",
];

const ROLES: Record<string, string[]> = {
  Administrador: PERMISSIONS,
  Empleado: ["product:create", "product:edit", "order:view", "order:edit", "quote:approve", "customer:view"],
  Vendedor: ["order:view", "order:edit", "quote:approve", "customer:view"],
  Deposito: ["stock:bulk_update", "order:view"],
  Contador: ["dashboard:view", "order:view"],
  Cliente: [],
};

const CUSTOMER_TYPES = [
  { name: "Particular", slug: "particular", isBusiness: false, defaultDiscountPct: 0 },
  { name: "Empresa", slug: "empresa", isBusiness: true, defaultDiscountPct: 5 },
  { name: "Constructor", slug: "constructor", isBusiness: true, defaultDiscountPct: 12 },
  { name: "Electricista", slug: "electricista", isBusiness: true, defaultDiscountPct: 10 },
  { name: "Gasista", slug: "gasista", isBusiness: true, defaultDiscountPct: 10 },
  { name: "Plomero", slug: "plomero", isBusiness: true, defaultDiscountPct: 10 },
  { name: "Arquitecto", slug: "arquitecto", isBusiness: true, defaultDiscountPct: 8 },
];

const CATEGORIES = [
  { name: "Herramientas eléctricas", slug: "herramientas-electricas", icon: "drill" },
  { name: "Herramientas manuales", slug: "herramientas-manuales", icon: "tool" },
  { name: "Electricidad", slug: "electricidad", icon: "bolt" },
  { name: "Plomería", slug: "plomeria", icon: "droplet" },
  { name: "Pinturería", slug: "pintureria", icon: "paint" },
  { name: "Construcción", slug: "construccion", icon: "wall" },
  { name: "Ferretería", slug: "ferreteria", icon: "screw" },
  { name: "Jardín", slug: "jardin", icon: "plant" },
  { name: "Seguridad", slug: "seguridad", icon: "helmet" },
];

const BRANDS = ["Bosch", "DeWalt", "Makita", "Tigre", "Sica", "Sherwin Williams", "Tramontina", "Black+Decker"];

async function main() {
  console.log("🌱 Seed FERRETODO...");

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  for (const [name, perms] of Object.entries(ROLES)) {
    await prisma.role.upsert({
      where: { name },
      update: { permissions: { set: perms.map((code) => ({ code })) } },
      create: { name, permissions: { connect: perms.map((code) => ({ code })) } },
    });
  }

  for (const ct of CUSTOMER_TYPES) {
    await prisma.customerType.upsert({
      where: { slug: ct.slug },
      update: {},
      create: { ...ct, defaultDiscountPct: new Prisma.Decimal(ct.defaultDiscountPct) },
    });
  }

  const branch = await prisma.branch.upsert({
    where: { id: "casa-central" },
    update: {},
    create: {
      id: "casa-central",
      name: "Casa Central - Río Cuarto",
      address: "Av. Ejemplo 1234, Córdoba, Argentina",
      phone: "0351-000-0000",
      isPickup: true,
    },
  });

  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, position: i },
    });
  }

  for (const name of BRANDS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  const tools = await prisma.category.findUnique({ where: { slug: "herramientas-electricas" } });
  const bosch = await prisma.brand.findUnique({ where: { slug: "bosch" } });

  if (tools && bosch) {
    const demo = await prisma.product.upsert({
      where: { slug: "taladro-percutor-bosch-gsb-13-re" },
      update: {},
      create: {
        name: "Taladro percutor Bosch GSB 13 RE 650W",
        slug: "taladro-percutor-bosch-gsb-13-re",
        sku: "BOSCH-GSB13RE",
        categoryId: tools.id,
        brandId: bosch.id,
        shortDescription: "Taladro percutor 650W con mandril de 13mm, ideal para pared y madera.",
        basePrice: new Prisma.Decimal(89999),
        previousPrice: new Prisma.Decimal(119999),
        cost: new Prisma.Decimal(62000),
        marginPct: new Prisma.Decimal(45),
        status: "ACTIVE",
        isFeatured: true,
        isOnSale: true,
        tags: ["taladro", "percutor", "bosch"],
      },
    });

    await prisma.inventoryItem.upsert({
      where: { productId_branchId: { productId: demo.id, branchId: branch.id } },
      update: {},
      create: { productId: demo.id, branchId: branch.id, available: 24, minStock: 5 },
    });
  }

  console.log("✅ Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
