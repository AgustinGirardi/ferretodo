import type { IconName } from "./icons";

export type StockStatus = "in" | "low" | "out";

export interface ProductSpec {
  name: string;
  value: string;
}

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  sku: string;
  price: number;
  previousPrice?: number;
  stock: StockStatus;
  iconName: IconName;
  shortDescription: string;
  longDescription: string;
  specs: ProductSpec[];
  tags: string[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isNew?: boolean;
  salesRank?: number;
}

export interface MockCategory {
  name: string;
  slug: string;
  iconName: IconName;
}

/**
 * Datos de muestra para maquetar tienda + ficha. En Fase 1 se reemplazan por la
 * API (GET /catalog/products, /products/:slug). Ver docs/03-BACKEND.md.
 */
export const categories: MockCategory[] = [
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

export const products: MockProduct[] = [
  {
    id: "1", slug: "taladro-percutor-bosch-gsb-13-re", name: "Taladro percutor Bosch GSB 13 RE 650W",
    brand: "Bosch", categorySlug: "herramientas-electricas", sku: "BOSCH-GSB13RE",
    price: 89999, previousPrice: 119999, stock: "in", iconName: "plug",
    shortDescription: "Taladro percutor 650W con mandril de 13mm, ideal para pared, madera y metal.",
    longDescription:
      "El Bosch GSB 13 RE es un taladro percutor compacto y potente, pensado tanto para el profesional como para el uso intensivo en el hogar. Su motor de 650W y la función percutora permiten perforar mampostería, madera y metal con facilidad. Empuñadura ergonómica antideslizante y velocidad variable reversible.",
    specs: [
      { name: "Potencia", value: "650 W" },
      { name: "Mandril", value: "13 mm" },
      { name: "Velocidad", value: "0–2800 rpm" },
      { name: "Función percutor", value: "Sí" },
      { name: "Garantía", value: "12 meses" },
    ],
    tags: ["taladro", "percutor", "bosch"], rating: 4.6, reviewCount: 124,
    isFeatured: true, salesRank: 95,
  },
  {
    id: "2", slug: "amoladora-angular-dewalt-dwe4120", name: "Amoladora angular DeWalt 820W 115mm",
    brand: "DeWalt", categorySlug: "herramientas-electricas", sku: "DEWALT-DWE4120",
    price: 76500, previousPrice: 95000, stock: "in", iconName: "wrench",
    shortDescription: "Amoladora angular 820W para corte y desbaste, disco de 115mm.",
    longDescription:
      "Amoladora angular DeWalt de 820W con protección contra reinicio y empuñadura lateral antivibración. Ideal para cortar y desbastar metal, mampostería y cerámica. Diseño compacto que reduce la fatiga en trabajos prolongados.",
    specs: [
      { name: "Potencia", value: "820 W" },
      { name: "Disco", value: "115 mm" },
      { name: "Velocidad", value: "11000 rpm" },
      { name: "Garantía", value: "12 meses" },
    ],
    tags: ["amoladora", "corte", "dewalt"], rating: 4.7, reviewCount: 88,
    isFeatured: true, salesRank: 80,
  },
  {
    id: "3", slug: "atornillador-makita-df333d-12v", name: "Atornillador inalámbrico Makita 12V",
    brand: "Makita", categorySlug: "herramientas-electricas", sku: "MAKITA-DF333D",
    price: 64900, stock: "in", iconName: "plug",
    shortDescription: "Atornillador/taladro a batería 12V con 2 baterías y maletín.",
    longDescription:
      "Atornillador inalámbrico Makita 12V max CXT, liviano y compacto. Incluye dos baterías de litio, cargador rápido y maletín. Luz LED y control de torque para atornillar sin dañar el material.",
    specs: [
      { name: "Voltaje", value: "12 V" },
      { name: "Torque", value: "30 Nm" },
      { name: "Baterías", value: "2 x 1.5 Ah" },
    ],
    tags: ["atornillador", "inalambrico", "makita"], rating: 4.8, reviewCount: 41,
    isNew: true, salesRank: 60,
  },
  {
    id: "4", slug: "juego-llaves-tramontina-8pz", name: "Juego de llaves combinadas 8 piezas",
    brand: "Tramontina", categorySlug: "herramientas-manuales", sku: "TRAM-LL8",
    price: 33900, previousPrice: 41000, stock: "in", iconName: "wrench",
    shortDescription: "Set de 8 llaves combinadas en acero cromo vanadio, 8 a 19mm.",
    longDescription:
      "Juego de 8 llaves combinadas Tramontina fabricadas en acero cromo vanadio con acabado espejo. Medidas de 8 a 19mm. Resistencia y durabilidad para uso profesional. Incluye organizador.",
    specs: [
      { name: "Piezas", value: "8" },
      { name: "Material", value: "Cromo vanadio" },
      { name: "Medidas", value: "8–19 mm" },
    ],
    tags: ["llaves", "set", "tramontina"], rating: 4.5, reviewCount: 67,
    isFeatured: true, salesRank: 70,
  },
  {
    id: "5", slug: "martillo-carpintero-tramontina-27mm", name: "Martillo carpintero 27mm cabo madera",
    brand: "Tramontina", categorySlug: "herramientas-manuales", sku: "TRAM-MC27",
    price: 8900, stock: "in", iconName: "hammer",
    shortDescription: "Martillo carpintero con uña, cabo de madera, 27mm.",
    longDescription:
      "Martillo carpintero Tramontina con cabeza de acero forjado y cabo de madera resistente. Equilibrado para reducir la fatiga y con uña para extracción de clavos.",
    specs: [
      { name: "Peso", value: "27 mm / 0.5 kg" },
      { name: "Cabo", value: "Madera" },
    ],
    tags: ["martillo", "carpintero"], rating: 4.4, reviewCount: 52, salesRank: 40,
  },
  {
    id: "6", slug: "pinza-universal-bahco-8", name: "Pinza universal 8 pulgadas",
    brand: "Bahco", categorySlug: "herramientas-manuales", sku: "BAHCO-PU8",
    price: 12500, stock: "in", iconName: "wrench",
    shortDescription: "Pinza universal 8'' con mango aislado, acero forjado.",
    longDescription:
      "Pinza universal Bahco de 8 pulgadas con filo de corte templado y mango aislado ergonómico. Ideal para electricistas y trabajos generales.",
    specs: [
      { name: "Tamaño", value: "8''" },
      { name: "Aislación", value: "Mango aislado" },
    ],
    tags: ["pinza", "electricista"], rating: 4.6, reviewCount: 33, salesRank: 35,
  },
  {
    id: "7", slug: "cable-unipolar-sica-25", name: "Cable unipolar 2.5mm x 100m",
    brand: "Sica", categorySlug: "electricidad", sku: "SICA-CU25",
    price: 24500, stock: "in", iconName: "zap",
    shortDescription: "Rollo de cable unipolar 2.5mm², 100 metros, normalizado.",
    longDescription:
      "Cable unipolar Sica de 2.5mm² apto para instalaciones domiciliarias e industriales. Cumple normas IRAM. Rollo de 100 metros. Disponible en varios colores.",
    specs: [
      { name: "Sección", value: "2.5 mm²" },
      { name: "Largo", value: "100 m" },
      { name: "Norma", value: "IRAM" },
    ],
    tags: ["cable", "electricidad"], rating: 4.7, reviewCount: 95,
    isFeatured: true, salesRank: 98,
  },
  {
    id: "8", slug: "disyuntor-diferencial-sica-2x40", name: "Disyuntor diferencial 2x40A",
    brand: "Sica", categorySlug: "electricidad", sku: "SICA-DD240",
    price: 28700, previousPrice: 35000, stock: "low", iconName: "zap",
    shortDescription: "Disyuntor diferencial bipolar 40A, 30mA. Protección contra fugas.",
    longDescription:
      "Disyuntor diferencial Sica 2x40A con sensibilidad de 30mA. Protege contra contactos directos e indirectos. Indispensable en todo tablero domiciliario según reglamentación.",
    specs: [
      { name: "Corriente", value: "40 A" },
      { name: "Sensibilidad", value: "30 mA" },
      { name: "Polos", value: "2" },
    ],
    tags: ["disyuntor", "tablero", "seguridad"], rating: 4.8, reviewCount: 44, salesRank: 55,
  },
  {
    id: "9", slug: "cano-pvc-tigre-110", name: "Caño PVC cloacal 110mm x 3m",
    brand: "Tigre", categorySlug: "plomeria", sku: "TIGRE-PVC110",
    price: 12300, stock: "in", iconName: "droplets",
    shortDescription: "Caño PVC para desagüe cloacal 110mm, barra de 3 metros.",
    longDescription:
      "Caño de PVC Tigre para desagües cloacales de 110mm de diámetro, barra de 3 metros. Resistente, liviano y de fácil instalación. Sistema de unión por espiga y enchufe.",
    specs: [
      { name: "Diámetro", value: "110 mm" },
      { name: "Largo", value: "3 m" },
      { name: "Uso", value: "Cloacal" },
    ],
    tags: ["caño", "pvc", "plomeria"], rating: 4.5, reviewCount: 28,
    isFeatured: true, salesRank: 50,
  },
  {
    id: "10", slug: "canilla-monocomando-fv-cocina", name: "Canilla cocina monocomando FV",
    brand: "FV", categorySlug: "plomeria", sku: "FV-MONO-COC",
    price: 45900, previousPrice: 58000, stock: "in", iconName: "droplets",
    shortDescription: "Grifería monocomando de cocina FV con pico móvil.",
    longDescription:
      "Canilla monocomando de cocina FV con pico alto giratorio y cartucho cerámico de larga duración. Acabado cromado resistente a la corrosión. Incluye flexibles de conexión.",
    specs: [
      { name: "Tipo", value: "Monocomando" },
      { name: "Material", value: "Bronce cromado" },
      { name: "Garantía", value: "5 años" },
    ],
    tags: ["canilla", "griferia", "cocina"], rating: 4.6, reviewCount: 37, salesRank: 45,
  },
  {
    id: "11", slug: "latex-interior-sherwin-20l", name: "Látex interior lavable 20L",
    brand: "Sherwin Williams", categorySlug: "pintureria", sku: "SW-LATEX20",
    price: 54900, previousPrice: 78000, stock: "low", iconName: "paintBucket",
    shortDescription: "Pintura látex interior lavable, 20 litros, blanco mate.",
    longDescription:
      "Látex interior Sherwin Williams de alta cubrición y terminación mate. Lavable, de bajo olor y secado rápido. Rinde hasta 12 m² por litro por mano. Balde de 20 litros.",
    specs: [
      { name: "Contenido", value: "20 L" },
      { name: "Terminación", value: "Mate" },
      { name: "Rendimiento", value: "~12 m²/L" },
    ],
    tags: ["pintura", "latex", "interior"], rating: 4.7, reviewCount: 61,
    isFeatured: true, salesRank: 75,
  },
  {
    id: "12", slug: "cemento-albanileria-50kg", name: "Cemento de albañilería 50kg",
    brand: "Holcim", categorySlug: "construccion", sku: "HOLCIM-50",
    price: 9800, stock: "in", iconName: "hardHat",
    shortDescription: "Bolsa de cemento de albañilería 50kg, uso general.",
    longDescription:
      "Cemento de albañilería Holcim de 50kg para mampostería, revoques y contrapisos. Buena trabajabilidad y resistencia. Producto de uso general en obra.",
    specs: [
      { name: "Peso", value: "50 kg" },
      { name: "Uso", value: "Albañilería" },
    ],
    tags: ["cemento", "construccion", "obra"], rating: 4.5, reviewCount: 112, salesRank: 99,
  },
  {
    id: "13", slug: "carretilla-reforzada-90l", name: "Carretilla reforzada 90L rueda neumática",
    brand: "Tradineg", categorySlug: "construccion", sku: "TRAD-CAR90",
    price: 78000, stock: "in", iconName: "hardHat",
    shortDescription: "Carretilla de obra 90L, batea reforzada y rueda neumática.",
    longDescription:
      "Carretilla reforzada de 90 litros con batea de chapa galvanizada y estructura tubular. Rueda neumática para terrenos irregulares. Ideal para obra y jardín.",
    specs: [
      { name: "Capacidad", value: "90 L" },
      { name: "Rueda", value: "Neumática" },
    ],
    tags: ["carretilla", "obra"], rating: 4.4, reviewCount: 19, salesRank: 30,
  },
  {
    id: "14", slug: "casco-seguridad-libus", name: "Casco de seguridad con arnés",
    brand: "Libus", categorySlug: "seguridad", sku: "LIBUS-CASCO",
    price: 6800, stock: "in", iconName: "shieldCheck",
    shortDescription: "Casco de seguridad con arnés regulable, certificado.",
    longDescription:
      "Casco de seguridad Libus con arnés de 4 puntos regulable y certificación IRAM. Liviano y resistente a impactos. Indispensable para trabajo en obra.",
    specs: [
      { name: "Norma", value: "IRAM 3620" },
      { name: "Arnés", value: "4 puntos" },
    ],
    tags: ["casco", "seguridad", "epp"], rating: 4.6, reviewCount: 24, salesRank: 25,
  },
  {
    id: "15", slug: "manguera-reforzada-1-2-20m", name: "Manguera reforzada 1/2'' x 20m",
    brand: "Tradineg", categorySlug: "jardin", sku: "TRAD-MANG20",
    price: 15600, stock: "in", iconName: "shovel",
    shortDescription: "Manguera de jardín reforzada 1/2'', 20 metros, tri-capa.",
    longDescription:
      "Manguera reforzada tri-capa de 1/2 pulgada y 20 metros, resistente a la presión y a los rayos UV. Flexible y antitorceduras. Ideal para riego y limpieza.",
    specs: [
      { name: "Diámetro", value: "1/2''" },
      { name: "Largo", value: "20 m" },
      { name: "Capas", value: "3" },
    ],
    tags: ["manguera", "jardin", "riego"], rating: 4.3, reviewCount: 15, salesRank: 20,
  },
];

export const featuredProducts: MockProduct[] = products
  .filter((p) => p.isFeatured)
  .slice(0, 4);

export const bestSellers: MockProduct[] = [...products]
  .sort((a, b) => (b.salesRank ?? 0) - (a.salesRank ?? 0))
  .slice(0, 4);
