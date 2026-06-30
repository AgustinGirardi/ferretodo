import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN = {
  email: "admin@ferretodo.com.ar",
  name: "Administrador",
  password: "admin1234",
};

const categories = [
  { name: "Herramientas eléctricas", slug: "herramientas-electricas", iconName: "plug" },
  { name: "Herramientas manuales", slug: "herramientas-manuales", iconName: "wrench" },
  { name: "Electricidad", slug: "electricidad", iconName: "zap" },
  { name: "Plomería", slug: "plomeria", iconName: "droplets" },
  { name: "Pinturería", slug: "pintureria", iconName: "paintBucket" },
  { name: "Construcción", slug: "construccion", iconName: "hardHat" },
  { name: "Ferretería", slug: "ferreteria", iconName: "bolt" },
  { name: "Jardín", slug: "jardin", iconName: "shovel" },
  { name: "Seguridad", slug: "seguridad", iconName: "shieldCheck" },
];

const brands = ["Bosch", "DeWalt", "Makita", "Tramontina", "Bahco", "Sica", "Tigre", "FV", "Sherwin Williams", "Holcim", "Tradineg", "Libus"];

type Seed = {
  slug: string; name: string; brand: string; categorySlug: string; sku: string;
  price: number; previousPrice?: number; cost?: number; stockQty: number; iconName: string;
  shortDescription: string; longDescription: string;
  specs: { name: string; value: string }[]; tags: string[];
  rating: number; reviewCount: number; isFeatured?: boolean; isNew?: boolean; salesRank: number;
};

const products: Seed[] = [
  { slug: "taladro-percutor-bosch-gsb-13-re", name: "Taladro percutor Bosch GSB 13 RE 650W", brand: "Bosch", categorySlug: "herramientas-electricas", sku: "BOSCH-GSB13RE", price: 89999, previousPrice: 119999, cost: 62000, stockQty: 24, iconName: "plug", shortDescription: "Taladro percutor 650W con mandril de 13mm, ideal para pared, madera y metal.", longDescription: "El Bosch GSB 13 RE es un taladro percutor compacto y potente. Su motor de 650W y la función percutora permiten perforar mampostería, madera y metal con facilidad. Empuñadura ergonómica y velocidad variable reversible.", specs: [{ name: "Potencia", value: "650 W" }, { name: "Mandril", value: "13 mm" }, { name: "Velocidad", value: "0–2800 rpm" }, { name: "Garantía", value: "12 meses" }], tags: ["taladro", "percutor", "bosch"], rating: 4.6, reviewCount: 124, isFeatured: true, salesRank: 95 },
  { slug: "amoladora-angular-dewalt-dwe4120", name: "Amoladora angular DeWalt 820W 115mm", brand: "DeWalt", categorySlug: "herramientas-electricas", sku: "DEWALT-DWE4120", price: 76500, previousPrice: 95000, cost: 54000, stockQty: 15, iconName: "wrench", shortDescription: "Amoladora angular 820W para corte y desbaste, disco de 115mm.", longDescription: "Amoladora angular DeWalt de 820W con protección contra reinicio y empuñadura antivibración. Ideal para cortar y desbastar metal, mampostería y cerámica.", specs: [{ name: "Potencia", value: "820 W" }, { name: "Disco", value: "115 mm" }, { name: "Velocidad", value: "11000 rpm" }], tags: ["amoladora", "corte", "dewalt"], rating: 4.7, reviewCount: 88, isFeatured: true, salesRank: 80 },
  { slug: "atornillador-makita-df333d-12v", name: "Atornillador inalámbrico Makita 12V", brand: "Makita", categorySlug: "herramientas-electricas", sku: "MAKITA-DF333D", price: 64900, cost: 45000, stockQty: 18, iconName: "plug", shortDescription: "Atornillador/taladro a batería 12V con 2 baterías y maletín.", longDescription: "Atornillador inalámbrico Makita 12V max CXT, liviano y compacto. Incluye dos baterías de litio, cargador rápido y maletín. Luz LED y control de torque.", specs: [{ name: "Voltaje", value: "12 V" }, { name: "Torque", value: "30 Nm" }, { name: "Baterías", value: "2 x 1.5 Ah" }], tags: ["atornillador", "inalambrico", "makita"], rating: 4.8, reviewCount: 41, isNew: true, salesRank: 60 },
  { slug: "juego-llaves-tramontina-8pz", name: "Juego de llaves combinadas 8 piezas", brand: "Tramontina", categorySlug: "herramientas-manuales", sku: "TRAM-LL8", price: 33900, previousPrice: 41000, cost: 22000, stockQty: 30, iconName: "wrench", shortDescription: "Set de 8 llaves combinadas en acero cromo vanadio, 8 a 19mm.", longDescription: "Juego de 8 llaves combinadas Tramontina en acero cromo vanadio con acabado espejo. Medidas de 8 a 19mm. Incluye organizador.", specs: [{ name: "Piezas", value: "8" }, { name: "Material", value: "Cromo vanadio" }, { name: "Medidas", value: "8–19 mm" }], tags: ["llaves", "set", "tramontina"], rating: 4.5, reviewCount: 67, isFeatured: true, salesRank: 70 },
  { slug: "martillo-carpintero-tramontina-27mm", name: "Martillo carpintero 27mm cabo madera", brand: "Tramontina", categorySlug: "herramientas-manuales", sku: "TRAM-MC27", price: 8900, cost: 5200, stockQty: 40, iconName: "hammer", shortDescription: "Martillo carpintero con uña, cabo de madera, 27mm.", longDescription: "Martillo carpintero Tramontina con cabeza de acero forjado y cabo de madera resistente. Equilibrado y con uña para extracción de clavos.", specs: [{ name: "Peso", value: "27 mm / 0.5 kg" }, { name: "Cabo", value: "Madera" }], tags: ["martillo", "carpintero"], rating: 4.4, reviewCount: 52, salesRank: 40 },
  { slug: "pinza-universal-bahco-8", name: "Pinza universal 8 pulgadas", brand: "Bahco", categorySlug: "herramientas-manuales", sku: "BAHCO-PU8", price: 12500, cost: 7800, stockQty: 22, iconName: "wrench", shortDescription: "Pinza universal 8'' con mango aislado, acero forjado.", longDescription: "Pinza universal Bahco de 8 pulgadas con filo de corte templado y mango aislado ergonómico. Ideal para electricistas.", specs: [{ name: "Tamaño", value: "8''" }, { name: "Aislación", value: "Mango aislado" }], tags: ["pinza", "electricista"], rating: 4.6, reviewCount: 33, salesRank: 35 },
  { slug: "cable-unipolar-sica-25", name: "Cable unipolar 2.5mm x 100m", brand: "Sica", categorySlug: "electricidad", sku: "SICA-CU25", price: 24500, cost: 16000, stockQty: 50, iconName: "zap", shortDescription: "Rollo de cable unipolar 2.5mm², 100 metros, normalizado.", longDescription: "Cable unipolar Sica de 2.5mm² apto para instalaciones domiciliarias e industriales. Cumple normas IRAM. Rollo de 100 metros.", specs: [{ name: "Sección", value: "2.5 mm²" }, { name: "Largo", value: "100 m" }, { name: "Norma", value: "IRAM" }], tags: ["cable", "electricidad"], rating: 4.7, reviewCount: 95, isFeatured: true, salesRank: 98 },
  { slug: "disyuntor-diferencial-sica-2x40", name: "Disyuntor diferencial 2x40A", brand: "Sica", categorySlug: "electricidad", sku: "SICA-DD240", price: 28700, previousPrice: 35000, cost: 19000, stockQty: 4, iconName: "zap", shortDescription: "Disyuntor diferencial bipolar 40A, 30mA. Protección contra fugas.", longDescription: "Disyuntor diferencial Sica 2x40A con sensibilidad de 30mA. Protege contra contactos directos e indirectos. Indispensable en todo tablero domiciliario.", specs: [{ name: "Corriente", value: "40 A" }, { name: "Sensibilidad", value: "30 mA" }, { name: "Polos", value: "2" }], tags: ["disyuntor", "tablero"], rating: 4.8, reviewCount: 44, salesRank: 55 },
  { slug: "cano-pvc-tigre-110", name: "Caño PVC cloacal 110mm x 3m", brand: "Tigre", categorySlug: "plomeria", sku: "TIGRE-PVC110", price: 12300, cost: 8000, stockQty: 35, iconName: "droplets", shortDescription: "Caño PVC para desagüe cloacal 110mm, barra de 3 metros.", longDescription: "Caño de PVC Tigre para desagües cloacales de 110mm, barra de 3 metros. Resistente, liviano y de fácil instalación.", specs: [{ name: "Diámetro", value: "110 mm" }, { name: "Largo", value: "3 m" }, { name: "Uso", value: "Cloacal" }], tags: ["caño", "pvc", "plomeria"], rating: 4.5, reviewCount: 28, isFeatured: true, salesRank: 50 },
  { slug: "canilla-monocomando-fv-cocina", name: "Canilla cocina monocomando FV", brand: "FV", categorySlug: "plomeria", sku: "FV-MONO-COC", price: 45900, previousPrice: 58000, cost: 31000, stockQty: 12, iconName: "droplets", shortDescription: "Grifería monocomando de cocina FV con pico móvil.", longDescription: "Canilla monocomando de cocina FV con pico alto giratorio y cartucho cerámico de larga duración. Acabado cromado. Incluye flexibles.", specs: [{ name: "Tipo", value: "Monocomando" }, { name: "Material", value: "Bronce cromado" }, { name: "Garantía", value: "5 años" }], tags: ["canilla", "griferia", "cocina"], rating: 4.6, reviewCount: 37, salesRank: 45 },
  { slug: "latex-interior-sherwin-20l", name: "Látex interior lavable 20L", brand: "Sherwin Williams", categorySlug: "pintureria", sku: "SW-LATEX20", price: 54900, previousPrice: 78000, cost: 38000, stockQty: 4, iconName: "paintBucket", shortDescription: "Pintura látex interior lavable, 20 litros, blanco mate.", longDescription: "Látex interior Sherwin Williams de alta cubrición y terminación mate. Lavable, de bajo olor y secado rápido. Balde de 20 litros.", specs: [{ name: "Contenido", value: "20 L" }, { name: "Terminación", value: "Mate" }, { name: "Rendimiento", value: "~12 m²/L" }], tags: ["pintura", "latex", "interior"], rating: 4.7, reviewCount: 61, isFeatured: true, salesRank: 75 },
  { slug: "cemento-albanileria-50kg", name: "Cemento de albañilería 50kg", brand: "Holcim", categorySlug: "construccion", sku: "HOLCIM-50", price: 9800, cost: 6500, stockQty: 120, iconName: "hardHat", shortDescription: "Bolsa de cemento de albañilería 50kg, uso general.", longDescription: "Cemento de albañilería Holcim de 50kg para mampostería, revoques y contrapisos. Buena trabajabilidad y resistencia.", specs: [{ name: "Peso", value: "50 kg" }, { name: "Uso", value: "Albañilería" }], tags: ["cemento", "construccion", "obra"], rating: 4.5, reviewCount: 112, salesRank: 99 },
  { slug: "carretilla-reforzada-90l", name: "Carretilla reforzada 90L rueda neumática", brand: "Tradineg", categorySlug: "construccion", sku: "TRAD-CAR90", price: 78000, cost: 52000, stockQty: 8, iconName: "hardHat", shortDescription: "Carretilla de obra 90L, batea reforzada y rueda neumática.", longDescription: "Carretilla reforzada de 90 litros con batea de chapa galvanizada y estructura tubular. Rueda neumática para terrenos irregulares.", specs: [{ name: "Capacidad", value: "90 L" }, { name: "Rueda", value: "Neumática" }], tags: ["carretilla", "obra"], rating: 4.4, reviewCount: 19, salesRank: 30 },
  { slug: "casco-seguridad-libus", name: "Casco de seguridad con arnés", brand: "Libus", categorySlug: "seguridad", sku: "LIBUS-CASCO", price: 6800, cost: 4200, stockQty: 60, iconName: "shieldCheck", shortDescription: "Casco de seguridad con arnés regulable, certificado.", longDescription: "Casco de seguridad Libus con arnés de 4 puntos regulable y certificación IRAM. Liviano y resistente a impactos.", specs: [{ name: "Norma", value: "IRAM 3620" }, { name: "Arnés", value: "4 puntos" }], tags: ["casco", "seguridad", "epp"], rating: 4.6, reviewCount: 24, salesRank: 25 },
  { slug: "manguera-reforzada-1-2-20m", name: "Manguera reforzada 1/2'' x 20m", brand: "Tradineg", categorySlug: "jardin", sku: "TRAD-MANG20", price: 15600, cost: 9800, stockQty: 28, iconName: "shovel", shortDescription: "Manguera de jardín reforzada 1/2'', 20 metros, tri-capa.", longDescription: "Manguera reforzada tri-capa de 1/2 pulgada y 20 metros, resistente a la presión y a los rayos UV. Flexible y antitorceduras.", specs: [{ name: "Diámetro", value: "1/2''" }, { name: "Largo", value: "20 m" }, { name: "Capas", value: "3" }], tags: ["manguera", "jardin", "riego"], rating: 4.3, reviewCount: 15, salesRank: 20 },
];

async function main() {
  console.log("🌱 Seed FERRETODO (SQLite)...");

  await prisma.adminUser.upsert({
    where: { email: ADMIN.email },
    update: {},
    create: {
      email: ADMIN.email,
      name: ADMIN.name,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    },
  });

  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, position: i },
    });
  }

  for (const name of brands) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  for (const p of products) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!category) continue;

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name, slug: p.slug, sku: p.sku,
        categoryId: category.id, brandId: brand?.id ?? null,
        price: p.price, previousPrice: p.previousPrice ?? null, cost: p.cost ?? null,
        stockQty: p.stockQty, iconName: p.iconName,
        shortDescription: p.shortDescription, longDescription: p.longDescription,
        specsJson: JSON.stringify(p.specs), tags: p.tags.join(","),
        rating: p.rating, reviewCount: p.reviewCount,
        isFeatured: p.isFeatured ?? false, isNew: p.isNew ?? false, salesRank: p.salesRank,
      },
    });
  }

  console.log("✅ Seed completo. Admin:", ADMIN.email, "/", ADMIN.password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
