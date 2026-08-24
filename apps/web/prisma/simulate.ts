/**
 * Simulación de uso diario de FERRETODO.
 *
 * 1) Amplía el catálogo con productos y existencias ("stock imaginario").
 * 2) Genera ~4 meses de ventas día por día, solo dentro de los horarios de
 *    atención del local (Lun–Vie 08:00–12:00 y 15:30–19:30 · Sáb 08:30–13:00 ·
 *    Dom cerrado), con feriados, estacionalidad, reposición semanal de stock e
 *    inflación de precios en el período.
 *
 * Determinista: dos corridas con la misma semilla dan exactamente lo mismo.
 * Re-ejecutable: si existe prisma/simulated-ids.json borra lo que generó la
 * corrida anterior antes de empezar; nunca toca pedidos ni clientes reales.
 *
 * Uso:  pnpm --filter @ferretodo/web exec tsx prisma/simulate.ts
 *       ... simulate.ts --reset   ← vacía la tienda antes: borra TODOS los
 *       productos, categorías, marcas, pedidos y clientes que haya, y deja solo
 *       lo simulado. No toca el usuario admin, los ajustes de la portada ni las
 *       solicitudes de arrepentimiento.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const IDS_FILE = join(__dirname, "simulated-ids.json");

// ─────────────────────────── Parámetros ───────────────────────────

const MONTHS_BACK = 4;
const AR_OFFSET = 3; // Argentina = UTC-3 todo el año (no hay horario de verano)
const ORDERS_WEEKDAY = 14; // promedio de ventas por día hábil
const ORDERS_SATURDAY = 9; // promedio de ventas los sábados (media jornada)
const MONTHLY_INFLATION = 0.025; // 2,5% mensual: lo de hace meses se vendió más barato
const CUSTOMER_ACCOUNTS = 45;
const ACCOUNT_ORDER_SHARE = 0.38; // pedidos hechos con cuenta iniciada
const CANCEL_RATE = 0.035;
const SEED = 20260824;

/** Horarios de atención en minutos desde la medianoche (hora local). */
const HOURS = {
  weekday: [
    { from: 8 * 60, to: 12 * 60, share: 0.55 },
    { from: 15 * 60 + 30, to: 19 * 60 + 30, share: 0.45 },
  ],
  saturday: [{ from: 8 * 60 + 30, to: 13 * 60, share: 1 }],
};

/** Feriados nacionales del período: el local no abre. */
const HOLIDAYS = new Set([
  "2026-05-01", // Día del Trabajador
  "2026-05-25", // Revolución de Mayo
  "2026-06-15", // Güemes (trasladado)
  "2026-06-20", // Belgrano
  "2026-07-09", // Independencia
  "2026-08-17", // San Martín (trasladado)
]);

/** Estacionalidad del rubro: otoño fuerte, mitad de invierno flojo. */
const MONTH_FACTOR: Record<number, number> = { 3: 1.05, 4: 1.0, 5: 0.92, 6: 0.88, 7: 1.02 };

// ─────────────────────────── Random determinista ───────────────────────────

let seedState = SEED;
function rand(): number {
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
/** Campana centrada en el medio del rango (promedio de 3 uniformes). */
const bell = () => (rand() + rand() + rand()) / 3;

function weighted<T>(entries: { item: T; weight: number }[]): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rand() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.item;
  }
  return entries[entries.length - 1]!.item;
}

/** Id con pinta de cuid, para poder usar createMany sin round-trips. */
const ALPHA = "abcdefghijklmnopqrstuvwxyz0123456789";
function makeId(): string {
  let s = "cm";
  for (let i = 0; i < 23; i++) s += ALPHA[Math.floor(rand() * ALPHA.length)];
  return s;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─────────────────────────── Catálogo agregado ───────────────────────────
// price/cost en pesos · stock = existencia al arrancar el período
// pop = qué tan seguido se vende (1 = rara vez, 10 = todos los días)

type NewProduct = {
  n: string; b: string; c: string; sku: string;
  price: number; prev?: number; cost: number; stock: number;
  icon: string; s: string; specs: [string, string][]; tags: string[]; pop: number;
};

/** Categorías y marcas que necesita el catálogo: se crean si no existen. */
const NEEDED_CATEGORIES = [
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

const NEEDED_BRANDS = [
  "Bosch", "DeWalt", "Makita", "Tramontina", "Bahco", "Sica", "Tigre", "FV",
  "Sherwin Williams", "Holcim", "Tradineg", "Libus",
  "Black+Decker", "Gamma", "Einhell", "Kärcher", "Stanley",
  "Philips", "3M", "Plavicon", "Rowa", "Acytra", "Fischer", "Poxipol",
];

const CATALOG: NewProduct[] = [
  // ── Herramientas eléctricas ──
  { n: "Sierra circular Bosch GKS 150 1500W", b: "Bosch", c: "herramientas-electricas", sku: "BOSCH-GKS150", price: 172000, prev: 205000, cost: 121000, stock: 9, icon: "plug", s: "Sierra circular de 1500W con disco de 184mm para cortes rectos en madera.", specs: [["Potencia", "1500 W"], ["Disco", "184 mm"], ["Corte máx.", "63 mm"]], tags: ["sierra", "circular", "madera"], pop: 2 },
  { n: "Lijadora orbital Black+Decker 240W", b: "Black+Decker", c: "herramientas-electricas", sku: "BD-BS600", price: 52900, cost: 35000, stock: 14, icon: "plug", s: "Lijadora orbital de 1/4 de hoja, ideal para terminaciones en madera y pintura.", specs: [["Potencia", "240 W"], ["Base", "1/4 de hoja"], ["Órbitas", "12000 opm"]], tags: ["lijadora", "orbital", "madera"], pop: 3 },
  { n: "Soldadora inverter Gamma 200A", b: "Gamma", c: "herramientas-electricas", sku: "GAMMA-INV200", price: 198000, cost: 138000, stock: 6, icon: "zap", s: "Soldadora inverter de 200A con display digital, liviana y de bajo consumo.", specs: [["Corriente", "200 A"], ["Electrodos", "1,6 a 4 mm"], ["Peso", "4,8 kg"]], tags: ["soldadora", "inverter", "electrodo"], pop: 2 },
  { n: "Rotomartillo Makita HR2470 SDS-Plus", b: "Makita", c: "herramientas-electricas", sku: "MAKITA-HR2470", price: 258000, prev: 299000, cost: 182000, stock: 5, icon: "plug", s: "Rotomartillo SDS-Plus de 780W con tres funciones: perforar, percutir y cincelar.", specs: [["Potencia", "780 W"], ["Energía de impacto", "2,4 J"], ["Mandril", "SDS-Plus"]], tags: ["rotomartillo", "sds", "makita"], pop: 2 },
  { n: "Mini amoladora Einhell 500W 115mm", b: "Einhell", c: "herramientas-electricas", sku: "EINHELL-TC115", price: 44900, cost: 29000, stock: 16, icon: "wrench", s: "Amoladora angular compacta de 500W para corte y desbaste liviano.", specs: [["Potencia", "500 W"], ["Disco", "115 mm"], ["Velocidad", "11000 rpm"]], tags: ["amoladora", "corte", "economica"], pop: 4 },
  { n: "Hidrolavadora Kärcher K3 1500W", b: "Kärcher", c: "herramientas-electricas", sku: "KARCHER-K3", price: 189000, cost: 132000, stock: 7, icon: "droplets", s: "Hidrolavadora de 120 bar con manguera de 6m, para autos, veredas y rejas.", specs: [["Presión", "120 bar"], ["Caudal", "380 l/h"], ["Manguera", "6 m"]], tags: ["hidrolavadora", "limpieza", "karcher"], pop: 3 },

  // ── Herramientas manuales ──
  { n: "Juego de destornilladores Stanley 6 piezas", b: "Stanley", c: "herramientas-manuales", sku: "STANLEY-DEST6", price: 13900, cost: 8200, stock: 34, icon: "wrench", s: "Set de 6 destornilladores punta plana y Phillips con mango antideslizante.", specs: [["Piezas", "6"], ["Puntas", "Plana y Phillips"]], tags: ["destornillador", "set", "stanley"], pop: 7 },
  { n: "Llave francesa Bahco 10 pulgadas", b: "Bahco", c: "herramientas-manuales", sku: "BAHCO-LF10", price: 21500, cost: 14000, stock: 20, icon: "wrench", s: "Llave ajustable de 10 pulgadas en acero forjado, apertura de 30mm.", specs: [["Largo", "10 pulgadas"], ["Apertura", "30 mm"]], tags: ["llave", "francesa", "ajustable"], pop: 5 },
  { n: "Arco de sierra 12 pulgadas con hoja", b: "Tradineg", c: "herramientas-manuales", sku: "TRAD-ARCO12", price: 8400, cost: 4800, stock: 28, icon: "wrench", s: "Arco de sierra de 12 pulgadas con tensor rápido, incluye hoja bimetal.", specs: [["Largo", "12 pulgadas"], ["Incluye", "1 hoja"]], tags: ["sierra", "arco", "corte"], pop: 6 },
  { n: "Cinta métrica Stanley 5m x 19mm", b: "Stanley", c: "herramientas-manuales", sku: "STANLEY-CM5", price: 7900, cost: 4300, stock: 45, icon: "wrench", s: "Cinta métrica de 5 metros con traba y clip para cinturón.", specs: [["Largo", "5 m"], ["Ancho", "19 mm"]], tags: ["cinta", "metrica", "medicion"], pop: 9 },
  { n: "Alicate de corte diagonal Tramontina 6 pulgadas", b: "Tramontina", c: "herramientas-manuales", sku: "TRAM-ALIC6", price: 10900, cost: 6600, stock: 26, icon: "wrench", s: "Alicate de corte diagonal con mangos aislados hasta 1000V.", specs: [["Largo", "6 pulgadas"], ["Aislación", "1000 V"]], tags: ["alicate", "corte", "electricista"], pop: 6 },
  { n: "Nivel de aluminio 60cm 3 burbujas", b: "Bahco", c: "herramientas-manuales", sku: "BAHCO-NIV60", price: 16200, cost: 10200, stock: 18, icon: "wrench", s: "Nivel de aluminio reforzado de 60cm con tres burbujas y bases imantadas.", specs: [["Largo", "60 cm"], ["Burbujas", "3"], ["Imantado", "Sí"]], tags: ["nivel", "burbuja", "obra"], pop: 5 },
  { n: "Caja de herramientas metálica 20 pulgadas", b: "Tradineg", c: "herramientas-manuales", sku: "TRAD-CAJA20", price: 31500, cost: 19800, stock: 12, icon: "wrench", s: "Caja de herramientas de chapa con bandeja extraíble y cierre reforzado.", specs: [["Largo", "20 pulgadas"], ["Bandeja", "Extraíble"]], tags: ["caja", "herramientas", "organizacion"], pop: 3 },

  // ── Electricidad ──
  { n: "Llave térmica bipolar Sica 25A", b: "Sica", c: "electricidad", sku: "SICA-TERM25", price: 17900, cost: 11400, stock: 30, icon: "zap", s: "Interruptor termomagnético bipolar de 25A para riel DIN.", specs: [["Corriente", "25 A"], ["Polos", "2"], ["Montaje", "Riel DIN"]], tags: ["termica", "tablero", "proteccion"], pop: 7 },
  { n: "Caja estanca 10x10 con tapa", b: "Sica", c: "electricidad", sku: "SICA-EST1010", price: 3600, cost: 1900, stock: 80, icon: "zap", s: "Caja de derivación estanca IP54 de 10x10cm para instalaciones exteriores.", specs: [["Medidas", "10 x 10 cm"], ["Protección", "IP54"]], tags: ["caja", "estanca", "exterior"], pop: 8 },
  { n: "Tomacorriente doble con módulo Sica", b: "Sica", c: "electricidad", sku: "SICA-TOM2", price: 7200, cost: 4200, stock: 65, icon: "zap", s: "Tomacorriente doble 10A con bastidor y tapa, línea moderna.", specs: [["Corriente", "10 A"], ["Módulos", "2"]], tags: ["tomacorriente", "modulo", "instalacion"], pop: 9 },
  { n: "Lámpara LED Philips 12W luz fría", b: "Philips", c: "electricidad", sku: "PHILIPS-LED12", price: 3900, cost: 2000, stock: 120, icon: "zap", s: "Lámpara LED de 12W rosca E27, luz fría de 1050 lúmenes.", specs: [["Potencia", "12 W"], ["Rosca", "E27"], ["Luz", "6500 K"]], tags: ["lampara", "led", "iluminacion"], pop: 10 },
  { n: "Reflector LED 50W para exterior", b: "Philips", c: "electricidad", sku: "PHILIPS-REF50", price: 21900, cost: 13800, stock: 22, icon: "zap", s: "Reflector LED de 50W IP65, ideal para patios, frentes y galpones.", specs: [["Potencia", "50 W"], ["Protección", "IP65"], ["Luz", "6000 K"]], tags: ["reflector", "led", "exterior"], pop: 5 },
  { n: "Cable taller 2x1.5mm por metro", b: "Sica", c: "electricidad", sku: "SICA-TALLER215", price: 2400, cost: 1450, stock: 400, icon: "zap", s: "Cable tipo taller 2x1,5mm² para prolongaciones y equipos, se corta por metro.", specs: [["Sección", "2 x 1,5 mm²"], ["Venta", "Por metro"]], tags: ["cable", "taller", "metro"], pop: 10 },
  { n: "Prolongador 3 tomas 3 metros", b: "Sica", c: "electricidad", sku: "SICA-PROL3", price: 11400, cost: 6900, stock: 35, icon: "zap", s: "Zapatilla con cable de 3 metros, 3 tomas y protección térmica.", specs: [["Tomas", "3"], ["Cable", "3 m"]], tags: ["zapatilla", "prolongador", "tomas"], pop: 7 },
  { n: "Cinta aisladora 3M 20m", b: "3M", c: "electricidad", sku: "3M-AISL20", price: 2900, cost: 1500, stock: 150, icon: "zap", s: "Cinta aisladora de PVC de 20 metros, uso profesional hasta 600V.", specs: [["Largo", "20 m"], ["Tensión", "600 V"]], tags: ["cinta", "aisladora", "consumible"], pop: 10 },

  // ── Plomería ──
  { n: "Flexible acero inoxidable FV 1/2 x 40cm", b: "FV", c: "plomeria", sku: "FV-FLEX40", price: 7400, cost: 4200, stock: 70, icon: "droplets", s: "Conexión flexible de acero inoxidable de 40cm para canillas e inodoros.", specs: [["Largo", "40 cm"], ["Rosca", "1/2"]], tags: ["flexible", "conexion", "agua"], pop: 9 },
  { n: "Sifón botella PVC Tigre", b: "Tigre", c: "plomeria", sku: "TIGRE-SIFON", price: 6300, cost: 3600, stock: 48, icon: "droplets", s: "Sifón botella de PVC para bacha de cocina o lavatorio, fácil de limpiar.", specs: [["Material", "PVC"], ["Salida", "40 mm"]], tags: ["sifon", "desague", "bacha"], pop: 7 },
  { n: "Codo PVC Tigre 110mm a 90 grados", b: "Tigre", c: "plomeria", sku: "TIGRE-CODO110", price: 4500, cost: 2500, stock: 90, icon: "droplets", s: "Codo de PVC de 110mm a 90 grados para desagüe cloacal.", specs: [["Diámetro", "110 mm"], ["Ángulo", "90 grados"]], tags: ["codo", "pvc", "cloacal"], pop: 8 },
  { n: "Rejilla de piso 15x15 acero inoxidable", b: "FV", c: "plomeria", sku: "FV-REJ1515", price: 10500, cost: 6300, stock: 32, icon: "droplets", s: "Rejilla de piso de acero inoxidable de 15x15cm con marco reforzado.", specs: [["Medidas", "15 x 15 cm"], ["Material", "Acero inoxidable"]], tags: ["rejilla", "piso", "desague"], pop: 6 },
  { n: "Termofusora 800W con boquillas", b: "Gamma", c: "plomeria", sku: "GAMMA-TERMO800", price: 86000, cost: 58000, stock: 8, icon: "droplets", s: "Termofusora de 800W con juego de boquillas de 20, 25 y 32mm y valija.", specs: [["Potencia", "800 W"], ["Boquillas", "20, 25 y 32 mm"]], tags: ["termofusora", "agua", "instalacion"], pop: 2 },
  { n: "Cinta teflón 12m", b: "Tigre", c: "plomeria", sku: "TIGRE-TEFLON12", price: 1500, cost: 700, stock: 200, icon: "droplets", s: "Cinta de teflón de 12 metros para sellar roscas de agua.", specs: [["Largo", "12 m"], ["Ancho", "12 mm"]], tags: ["teflon", "sellado", "consumible"], pop: 10 },
  { n: "Bomba presurizadora Rowa Press 15", b: "Rowa", c: "plomeria", sku: "ROWA-PRESS15", price: 312000, cost: 228000, stock: 4, icon: "droplets", s: "Bomba presurizadora automática para mejorar la presión de toda la casa.", specs: [["Caudal", "35 l/min"], ["Potencia", "0,5 HP"]], tags: ["bomba", "presion", "agua"], pop: 1 },
  { n: "Válvula esclusa FV 1/2", b: "FV", c: "plomeria", sku: "FV-ESCL12", price: 13200, cost: 8300, stock: 40, icon: "droplets", s: "Válvula esclusa de bronce de 1/2 pulgada para corte de agua.", specs: [["Medida", "1/2"], ["Material", "Bronce"]], tags: ["valvula", "esclusa", "bronce"], pop: 6 },

  // ── Pinturería ──
  { n: "Látex exterior Plavicon 20L", b: "Plavicon", c: "pintureria", sku: "PLAV-EXT20", price: 68000, prev: 89000, cost: 47000, stock: 14, icon: "paintBucket", s: "Látex acrílico para exteriores, resistente a la intemperie y a los hongos.", specs: [["Contenido", "20 L"], ["Terminación", "Mate"], ["Rendimiento", "~10 m²/L"]], tags: ["pintura", "latex", "exterior"], pop: 5 },
  { n: "Esmalte sintético blanco brillante 1L", b: "Sherwin Williams", c: "pintureria", sku: "SW-ESM1", price: 21500, cost: 14000, stock: 42, icon: "paintBucket", s: "Esmalte sintético brillante para madera y metal, secado rápido.", specs: [["Contenido", "1 L"], ["Terminación", "Brillante"]], tags: ["esmalte", "sintetico", "madera"], pop: 7 },
  { n: "Rodillo de lana 22cm con bandeja", b: "Tradineg", c: "pintureria", sku: "TRAD-ROD22", price: 8900, cost: 5000, stock: 55, icon: "paintBucket", s: "Rodillo de lana natural de 22cm con mango y bandeja plástica.", specs: [["Ancho", "22 cm"], ["Incluye", "Bandeja"]], tags: ["rodillo", "pintura", "accesorio"], pop: 8 },
  { n: "Pincel cerda natural 2 pulgadas", b: "Tradineg", c: "pintureria", sku: "TRAD-PIN2", price: 3900, cost: 2100, stock: 85, icon: "paintBucket", s: "Pincel de cerda natural de 2 pulgadas con mango de madera.", specs: [["Ancho", "2 pulgadas"], ["Cerda", "Natural"]], tags: ["pincel", "pintura", "consumible"], pop: 9 },
  { n: "Enduido plástico interior 4L", b: "Plavicon", c: "pintureria", sku: "PLAV-END4", price: 17400, cost: 11000, stock: 36, icon: "paintBucket", s: "Enduido plástico al agua para emparejar paredes antes de pintar.", specs: [["Contenido", "4 L"], ["Uso", "Interior"]], tags: ["enduido", "pared", "preparacion"], pop: 6 },
  { n: "Aguarrás mineral 1L", b: "Sherwin Williams", c: "pintureria", sku: "SW-AGUA1", price: 4900, cost: 2700, stock: 90, icon: "paintBucket", s: "Diluyente de aguarrás mineral para esmaltes sintéticos y limpieza.", specs: [["Contenido", "1 L"]], tags: ["aguarras", "diluyente", "consumible"], pop: 8 },
  { n: "Fijador sellador al agua 10L", b: "Plavicon", c: "pintureria", sku: "PLAV-FIJ10", price: 36000, cost: 24000, stock: 20, icon: "paintBucket", s: "Fijador sellador al agua para paredes nuevas o muy absorbentes.", specs: [["Contenido", "10 L"], ["Base", "Agua"]], tags: ["fijador", "sellador", "pared"], pop: 5 },

  // ── Construcción ──
  { n: "Cal hidratada 25kg", b: "Holcim", c: "construccion", sku: "HOLCIM-CAL25", price: 7900, cost: 4900, stock: 150, icon: "hardHat", s: "Bolsa de cal hidratada de 25kg para morteros y revoques.", specs: [["Peso", "25 kg"], ["Uso", "Mortero y revoque"]], tags: ["cal", "obra", "revoque"], pop: 9 },
  { n: "Hierro nervado 8mm x 12m", b: "Holcim", c: "construccion", sku: "HOLCIM-H8", price: 24500, cost: 17000, stock: 60, icon: "hardHat", s: "Barra de hierro nervado de 8mm y 12 metros para estructuras.", specs: [["Diámetro", "8 mm"], ["Largo", "12 m"]], tags: ["hierro", "estructura", "obra"], pop: 6 },
  { n: "Ladrillo hueco 12x18x33 por unidad", b: "Holcim", c: "construccion", sku: "HOLCIM-LAD12", price: 1550, cost: 950, stock: 900, icon: "hardHat", s: "Ladrillo cerámico hueco de 12x18x33cm para mampostería.", specs: [["Medidas", "12 x 18 x 33 cm"], ["Venta", "Por unidad"]], tags: ["ladrillo", "hueco", "obra"], pop: 8 },
  { n: "Malla soldada 15x15 de 2x5m", b: "Holcim", c: "construccion", sku: "HOLCIM-MALLA", price: 52000, cost: 37000, stock: 25, icon: "hardHat", s: "Panel de malla soldada 15x15cm de 2x5 metros para contrapisos y losas.", specs: [["Retícula", "15 x 15 cm"], ["Panel", "2 x 5 m"]], tags: ["malla", "contrapiso", "obra"], pop: 5 },
  { n: "Hormigonera 130L a motor", b: "Gamma", c: "construccion", sku: "GAMMA-HORM130", price: 465000, cost: 340000, stock: 3, icon: "hardHat", s: "Hormigonera de 130 litros con motor eléctrico de 1HP y ruedas de traslado.", specs: [["Capacidad", "130 L"], ["Motor", "1 HP"]], tags: ["hormigonera", "obra", "mezcla"], pop: 1 },
  { n: "Balde de albañil 20L reforzado", b: "Tradineg", c: "construccion", sku: "TRAD-BALDE20", price: 4500, cost: 2400, stock: 110, icon: "hardHat", s: "Balde plástico reforzado de 20 litros con manija metálica.", specs: [["Capacidad", "20 L"], ["Material", "Plástico reforzado"]], tags: ["balde", "obra", "consumible"], pop: 9 },

  // ── Ferretería ──
  { n: "Tornillos autoperforantes T1 x100", b: "Fischer", c: "ferreteria", sku: "FISCHER-T1100", price: 5600, cost: 3100, stock: 140, icon: "bolt", s: "Caja de 100 tornillos autoperforantes T1 para chapa y perfilería.", specs: [["Cantidad", "100"], ["Tipo", "T1 autoperforante"]], tags: ["tornillos", "chapa", "consumible"], pop: 10 },
  { n: "Tarugos Fischer 8mm x50", b: "Fischer", c: "ferreteria", sku: "FISCHER-TAR8", price: 4200, cost: 2200, stock: 160, icon: "bolt", s: "Bolsa de 50 tarugos de 8mm con tope, para pared maciza y hueca.", specs: [["Diámetro", "8 mm"], ["Cantidad", "50"]], tags: ["tarugos", "fijacion", "consumible"], pop: 10 },
  { n: "Candado de bronce 50mm", b: "Acytra", c: "ferreteria", sku: "ACYTRA-CAND50", price: 11200, cost: 6800, stock: 44, icon: "bolt", s: "Candado macizo de bronce de 50mm con tres llaves.", specs: [["Ancho", "50 mm"], ["Llaves", "3"]], tags: ["candado", "seguridad", "bronce"], pop: 7 },
  { n: "Cerradura doble paleta Acytra", b: "Acytra", c: "ferreteria", sku: "ACYTRA-DP500", price: 52000, cost: 36000, stock: 15, icon: "bolt", s: "Cerradura de seguridad de doble paleta para puerta de entrada.", specs: [["Tipo", "Doble paleta"], ["Llaves", "3"]], tags: ["cerradura", "seguridad", "puerta"], pop: 3 },
  { n: "Bisagra pomela 3 pulgadas por par", b: "Acytra", c: "ferreteria", sku: "ACYTRA-BIS3", price: 5400, cost: 2900, stock: 95, icon: "bolt", s: "Par de bisagras pomela de 3 pulgadas en acero zincado.", specs: [["Medida", "3 pulgadas"], ["Cantidad", "2"]], tags: ["bisagra", "puerta", "herrajes"], pop: 8 },
  { n: "Cadena galvanizada 6mm por metro", b: "Tradineg", c: "ferreteria", sku: "TRAD-CAD6", price: 3500, cost: 2000, stock: 180, icon: "bolt", s: "Cadena de eslabón galvanizada de 6mm, se corta por metro.", specs: [["Diámetro", "6 mm"], ["Venta", "Por metro"]], tags: ["cadena", "galvanizada", "metro"], pop: 6 },
  { n: "Alambre galvanizado N16 por kilo", b: "Tradineg", c: "ferreteria", sku: "TRAD-ALAM16", price: 5900, cost: 3500, stock: 120, icon: "bolt", s: "Alambre galvanizado número 16 por kilo, para atar y alambrar.", specs: [["Calibre", "N° 16"], ["Venta", "Por kg"]], tags: ["alambre", "galvanizado", "obra"], pop: 7 },
  { n: "Silicona neutra transparente 280ml", b: "3M", c: "ferreteria", sku: "3M-SIL280", price: 7600, cost: 4300, stock: 100, icon: "bolt", s: "Sellador de silicona neutra transparente para baños, cocinas y aberturas.", specs: [["Contenido", "280 ml"], ["Tipo", "Neutra"]], tags: ["silicona", "sellador", "consumible"], pop: 10 },
  { n: "Adhesivo epoxi Poxipol 21g", b: "Poxipol", c: "ferreteria", sku: "POXI-21", price: 4800, cost: 2600, stock: 130, icon: "bolt", s: "Adhesivo epoxi de dos componentes: pega metal, madera, vidrio y plástico.", specs: [["Contenido", "21 g"], ["Secado", "10 minutos"]], tags: ["adhesivo", "epoxi", "consumible"], pop: 9 },
  { n: "Discos de corte metal 115mm x10", b: "Bosch", c: "ferreteria", sku: "BOSCH-DISCO10", price: 14500, cost: 8600, stock: 70, icon: "bolt", s: "Pack de 10 discos de corte de 115mm para metal, espesor 1mm.", specs: [["Diámetro", "115 mm"], ["Espesor", "1 mm"], ["Cantidad", "10"]], tags: ["disco", "corte", "amoladora"], pop: 9 },
  { n: "Mecha widia 6mm para mampostería", b: "Bosch", c: "ferreteria", sku: "BOSCH-WID6", price: 3300, cost: 1700, stock: 140, icon: "bolt", s: "Mecha de widia de 6mm para perforar pared, ladrillo y hormigón.", specs: [["Diámetro", "6 mm"], ["Uso", "Mampostería"]], tags: ["mecha", "widia", "consumible"], pop: 10 },

  // ── Jardín ──
  { n: "Bordeadora eléctrica Gamma 1000W", b: "Gamma", c: "jardin", sku: "GAMMA-BORD1000", price: 96000, cost: 67000, stock: 8, icon: "shovel", s: "Bordeadora eléctrica de 1000W con cabezal de nylon y mango regulable.", specs: [["Potencia", "1000 W"], ["Corte", "38 cm"]], tags: ["bordeadora", "cesped", "jardin"], pop: 3 },
  { n: "Tijera de podar Tramontina 8 pulgadas", b: "Tramontina", c: "jardin", sku: "TRAM-POD8", price: 18900, cost: 12000, stock: 24, icon: "shovel", s: "Tijera de podar con hoja de acero y traba de seguridad.", specs: [["Largo", "8 pulgadas"], ["Corte", "20 mm"]], tags: ["tijera", "poda", "jardin"], pop: 5 },
  { n: "Pala de punta con cabo Tramontina", b: "Tramontina", c: "jardin", sku: "TRAM-PALA", price: 22500, cost: 14500, stock: 26, icon: "shovel", s: "Pala de punta con cabo de madera de 71cm, para tierra y pozos.", specs: [["Cabo", "71 cm"], ["Hoja", "Acero templado"]], tags: ["pala", "obra", "jardin"], pop: 6 },
  { n: "Rastrillo 14 dientes con cabo", b: "Tradineg", c: "jardin", sku: "TRAD-RAST14", price: 14200, cost: 8700, stock: 22, icon: "shovel", s: "Rastrillo de 14 dientes de acero con cabo de madera.", specs: [["Dientes", "14"], ["Cabo", "Madera"]], tags: ["rastrillo", "jardin", "hojas"], pop: 5 },
  { n: "Regadera plástica 10L", b: "Tradineg", c: "jardin", sku: "TRAD-REG10", price: 7200, cost: 3900, stock: 40, icon: "shovel", s: "Regadera plástica de 10 litros con flor desmontable.", specs: [["Capacidad", "10 L"]], tags: ["regadera", "riego", "jardin"], pop: 6 },
  { n: "Cortadora de césped a explosión 4HP", b: "Gamma", c: "jardin", sku: "GAMMA-CORT4", price: 585000, cost: 430000, stock: 3, icon: "shovel", s: "Cortadora de césped a nafta de 4HP con bolsa recolectora y altura regulable.", specs: [["Motor", "4 HP"], ["Corte", "46 cm"], ["Bolsa", "55 L"]], tags: ["cortadora", "cesped", "nafta"], pop: 1 },

  // ── Seguridad ──
  { n: "Guantes de vaqueta reforzados Libus", b: "Libus", c: "seguridad", sku: "LIBUS-VAQ", price: 6900, cost: 3800, stock: 90, icon: "shieldCheck", s: "Guantes de vaqueta con refuerzo en palma, para obra y manipulación.", specs: [["Material", "Vaqueta"], ["Talle", "Único"]], tags: ["guantes", "epp", "obra"], pop: 10 },
  { n: "Antiparras de seguridad incoloras", b: "Libus", c: "seguridad", sku: "LIBUS-ANTIP", price: 4900, cost: 2600, stock: 75, icon: "shieldCheck", s: "Antiparras de policarbonato incoloras con protección UV, certificadas.", specs: [["Norma", "IRAM 3630"], ["Lente", "Policarbonato"]], tags: ["antiparras", "epp", "vista"], pop: 8 },
  { n: "Protector auditivo de copa Libus", b: "Libus", c: "seguridad", sku: "LIBUS-AUD", price: 10200, cost: 6100, stock: 40, icon: "shieldCheck", s: "Protector auditivo tipo copa con vincha regulable, 25dB de atenuación.", specs: [["Atenuación", "25 dB"], ["Vincha", "Regulable"]], tags: ["auditivo", "epp", "ruido"], pop: 5 },
  { n: "Barbijo N95 pack x5", b: "Libus", c: "seguridad", sku: "LIBUS-N95-5", price: 7200, cost: 4000, stock: 60, icon: "shieldCheck", s: "Pack de 5 barbijos N95 descartables para polvo y partículas.", specs: [["Cantidad", "5"], ["Filtrado", "N95"]], tags: ["barbijo", "epp", "polvo"], pop: 7 },
  { n: "Arnés de seguridad completo Libus", b: "Libus", c: "seguridad", sku: "LIBUS-ARNES", price: 89000, cost: 62000, stock: 6, icon: "shieldCheck", s: "Arnés de cuerpo completo con cabo de vida, para trabajo en altura.", specs: [["Norma", "IRAM 3622"], ["Puntos", "4"]], tags: ["arnes", "altura", "epp"], pop: 2 },
  { n: "Botín de seguridad con puntera de acero", b: "Libus", c: "seguridad", sku: "LIBUS-BOTIN", price: 68000, cost: 47000, stock: 28, icon: "shieldCheck", s: "Botín de cuero con puntera de acero y suela antideslizante, del 38 al 45.", specs: [["Puntera", "Acero"], ["Talles", "38 a 45"]], tags: ["botin", "calzado", "epp"], pop: 6 },
  { n: "Matafuego ABC 1kg con soporte", b: "Libus", c: "seguridad", sku: "LIBUS-MAT1", price: 26500, cost: 17000, stock: 30, icon: "shieldCheck", s: "Matafuego de polvo químico ABC de 1kg con manómetro y soporte para auto.", specs: [["Capacidad", "1 kg"], ["Clase", "ABC"]], tags: ["matafuego", "seguridad", "auto"], pop: 6 },
];

/** Qué tan seguido se vende cada producto que ya estaba cargado. */
const EXISTING_POP: Record<string, number> = {
  "taladro-percutor-bosch-gsb-13-re": 4,
  "amoladora-angular-dewalt-dwe4120": 3,
  "atornillador-makita-df333d-12v": 3,
  "juego-llaves-tramontina-8pz": 5,
  "martillo-carpintero-tramontina-27mm": 8,
  "pinza-universal-bahco-8": 7,
  "cable-unipolar-sica-25": 9,
  "disyuntor-diferencial-sica-2x40": 5,
  "cano-pvc-tigre-110": 8,
  "canilla-monocomando-fv-cocina": 4,
  "latex-interior-sherwin-20l": 6,
  "cemento-albanileria-50kg": 10,
  "carretilla-reforzada-90l": 3,
  "casco-seguridad-libus": 7,
  "manguera-reforzada-1-2-20m": 6,
};

/** Existencia inicial de los productos que ya estaban (el seed traía muy poco). */
const EXISTING_STOCK: Record<string, number> = {
  "cemento-albanileria-50kg": 300,
  "cable-unipolar-sica-25": 120,
  "cano-pvc-tigre-110": 80,
  "martillo-carpintero-tramontina-27mm": 60,
  "casco-seguridad-libus": 70,
  "pinza-universal-bahco-8": 45,
  "manguera-reforzada-1-2-20m": 40,
  "latex-interior-sherwin-20l": 25,
  "disyuntor-diferencial-sica-2x40": 30,
  "juego-llaves-tramontina-8pz": 35,
  "canilla-monocomando-fv-cocina": 20,
  "taladro-percutor-bosch-gsb-13-re": 24,
  "amoladora-angular-dewalt-dwe4120": 15,
  "atornillador-makita-df333d-12v": 18,
  "carretilla-reforzada-90l": 12,
};

// ─────────────────────────── Personas y direcciones ───────────────────────────

const FIRST_NAMES = ["Juan", "María", "Carlos", "Lucía", "Diego", "Sofía", "Martín", "Ana", "Pablo", "Valeria", "Gustavo", "Romina", "Sergio", "Natalia", "Fernando", "Carla", "Ricardo", "Julieta", "Emiliano", "Mariana", "Hugo", "Silvia", "Néstor", "Paula", "Leandro", "Verónica", "Matías", "Gabriela", "Alejandro", "Daniela", "Marcelo", "Cecilia", "Facundo", "Andrea", "Rubén", "Florencia"];
const LAST_NAMES = ["Gómez", "Fernández", "Rodríguez", "López", "Martínez", "Pérez", "Sosa", "Romero", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina", "Herrera", "Aguirre", "Ponce", "Cabrera", "Molina", "Ledesma", "Quiroga", "Castro", "Villalba", "Ferreyra", "Bustos", "Peralta", "Ojeda", "Maldonado"];
const MAIL_HOSTS = ["gmail.com", "gmail.com", "gmail.com", "hotmail.com", "yahoo.com.ar", "outlook.com"];

const STREETS = ["Constitución", "Sobremonte", "General Paz", "Alvear", "Belgrano", "Colón", "Buenos Aires", "Cabrera", "Deán Funes", "Mendoza", "Lamadrid", "Baigorria", "Vélez Sarsfield", "San Martín", "Italia", "España", "Rivadavia", "Sarmiento", "25 de Mayo", "Moreno", "Paunero", "Sadi Carnot", "Bolívar", "Trejo"];

const NOTES = [
  "Paso a retirar después de las 18.",
  "Timbre no anda, llamar al llegar.",
  "Dejar en portería si no estoy.",
  "Necesito factura A.",
  "Confirmar antes de despachar, gracias.",
  "Entregar por la mañana si se puede.",
  "Es para una obra, avisar si falta algo.",
];

// ─────────────────────────── Fechas y horarios ───────────────────────────

/** Fecha UTC a partir de una hora local argentina. */
function arDate(y: number, m: number, d: number, minutes: number, sec = 0): Date {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return new Date(Date.UTC(y, m, d, h + AR_OFFSET, min, sec));
}

const dayKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Momento del día dentro de los horarios de atención (minutos locales). */
function openingMinute(isSaturday: boolean): number {
  const windows = isSaturday ? HOURS.saturday : HOURS.weekday;
  const w = weighted(windows.map((x) => ({ item: x, weight: x.share })));
  // Entra gente toda la jornada (parejo) con un pico a media mañana / media tarde.
  const t = rand() < 0.55 ? rand() : bell();
  return Math.round(w.from + t * (w.to - w.from));
}

// ─────────────────────────── Simulación ───────────────────────────

type Pool = {
  id: string; name: string; price: number; pop: number;
  stock: number; target: number; sold: number;
};

type SimOrder = {
  id: string; orderNumber: string; customerName: string; customerEmail: string;
  customerPhone: string; deliveryMethod: string; zone: string | null; address: string | null;
  paymentMethod: string; status: string; subtotal: number; shippingCost: number;
  discount: number; total: number; notes: string | null; customerId: string | null;
  createdAt: Date; updatedAt: Date;
};

type SimItem = {
  id: string; orderId: string; productId: string; productName: string;
  unitPrice: number; quantity: number; lineTotal: number;
};

const SHIPPING = { centro: 2500, norte: 3500, sur: 3500, afueras: 5000 } as const;

/** Cantidad típica por línea: lo barato se lleva de a varios. */
function quantityFor(price: number): number {
  if (price < 3000) return weighted([{ item: 1, weight: 4 }, { item: 2, weight: 4 }, { item: 5, weight: 2 }, { item: 10, weight: 1 }]);
  if (price < 8000) return weighted([{ item: 1, weight: 6 }, { item: 2, weight: 3 }, { item: 4, weight: 1 }]);
  if (price < 20000) return weighted([{ item: 1, weight: 8 }, { item: 2, weight: 2 }]);
  if (price < 80000) return weighted([{ item: 1, weight: 12 }, { item: 2, weight: 1 }]);
  return 1;
}

/** Precio de ese día: hacia atrás en el tiempo todo valía menos. */
function historicPrice(price: number, monthsAgo: number): number {
  const p = price / Math.pow(1 + MONTHLY_INFLATION, monthsAgo);
  return Math.max(100, Math.round(p / 100) * 100);
}

function statusFor(ageDays: number): string {
  if (rand() < CANCEL_RATE) return "CANCELLED";
  if (ageDays > 5) return "DELIVERED";
  if (ageDays > 2) return rand() < 0.85 ? "DELIVERED" : "READY";
  if (ageDays > 1) return weighted([{ item: "DELIVERED", weight: 5 }, { item: "READY", weight: 3 }, { item: "PREPARING", weight: 2 }]);
  return weighted([{ item: "PENDING", weight: 5 }, { item: "PREPARING", weight: 3 }, { item: "READY", weight: 2 }]);
}

/**
 * Vacía el contenido de la tienda para que quede solo lo simulado.
 * Deliberadamente NO borra: AdminUser (te dejaría afuera del panel),
 * SiteSetting (los textos de la portada) ni WithdrawalRequest (son pedidos
 * legales de clientes, Res. 424/2020).
 */
async function resetStore() {
  const orders = await prisma.order.deleteMany({}); // OrderItem cae por cascade
  const customers = await prisma.customer.deleteMany({});
  const products = await prisma.product.deleteMany({});
  const categories = await prisma.category.deleteMany({});
  const brands = await prisma.brand.deleteMany({});
  console.log(
    `🗑️  Tienda vaciada: ${orders.count} pedidos, ${customers.count} clientes, ` +
      `${products.count} productos, ${categories.count} categorías, ${brands.count} marcas.`
  );
}

async function main() {
  const now = new Date();

  if (process.argv.includes("--reset")) await resetStore();

  // ── Limpieza de una corrida anterior ──
  if (existsSync(IDS_FILE)) {
    const prev = JSON.parse(readFileSync(IDS_FILE, "utf8")) as { orderIds: string[]; customerIds: string[] };
    const o = await prisma.order.deleteMany({ where: { id: { in: prev.orderIds } } });
    const c = await prisma.customer.deleteMany({ where: { id: { in: prev.customerIds } } });
    console.log(`🧹 Corrida anterior borrada: ${o.count} pedidos, ${c.count} clientes.`);
  }

  // ── 1. Catálogo y stock ──
  // Las categorías y marcas se crean si faltan, así el script se puede correr
  // sobre una base recién desplegada sin depender del seed (que además crearía
  // un admin con contraseña de desarrollo).
  const lastPosition = (await prisma.category.aggregate({ _max: { position: true } }))._max.position ?? -1;
  for (const [i, c] of NEEDED_CATEGORIES.entries()) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, position: lastPosition + 1 + i } });
  }
  for (const name of NEEDED_BRANDS) {
    await prisma.brand.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
  }

  const categories = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
  const brands = new Map((await prisma.brand.findMany()).map((b) => [b.slug, b.id]));

  for (const p of CATALOG) {
    const categoryId = categories.get(p.c);
    if (!categoryId) throw new Error(`Categoría inexistente: ${p.c}`);
    const data = {
      name: p.n, slug: slugify(p.n), sku: p.sku,
      categoryId, brandId: brands.get(slugify(p.b)) ?? null,
      price: p.price, previousPrice: p.prev ?? null, cost: p.cost,
      stockQty: p.stock, iconName: p.icon,
      shortDescription: p.s,
      longDescription: `${p.s} Disponible en el local de FERRETODO, en Río Cuarto, con asesoramiento y garantía de fábrica.`,
      specsJson: JSON.stringify(p.specs.map(([name, value]) => ({ name, value }))),
      tags: p.tags.join(","),
      rating: Math.round((3.9 + rand() * 1.05) * 10) / 10,
      reviewCount: randInt(3, 90),
    };
    await prisma.product.upsert({ where: { slug: data.slug }, update: data, create: data });
  }

  // Repone las existencias de los productos que ya estaban en la tienda.
  for (const [slug, stockQty] of Object.entries(EXISTING_STOCK)) {
    await prisma.product.updateMany({ where: { slug }, data: { stockQty } });
  }

  const allProducts = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, slug: true, name: true, price: true, stockQty: true },
  });

  const popBySlug = new Map<string, number>(Object.entries(EXISTING_POP));
  for (const p of CATALOG) popBySlug.set(slugify(p.n), p.pop);

  const pool: Pool[] = allProducts.map((p) => ({
    id: p.id, name: p.name, price: p.price,
    pop: popBySlug.get(p.slug) ?? 4,
    stock: p.stockQty, target: p.stockQty, sold: 0,
  }));

  // ── 2. Clientes registrados ──
  const passwordHash = await bcrypt.hash("cliente1234", 10);
  const start = new Date(now);
  start.setMonth(start.getMonth() - MONTHS_BACK);

  const usedEmails = new Set<string>((await prisma.customer.findMany({ select: { email: true } })).map((c) => c.email));
  const customers: { id: string; name: string; email: string; phone: string; passwordHash: string | null; googleId: string | null; createdAt: Date }[] = [];

  for (let i = 0; i < CUSTOMER_ACCOUNTS; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    let email = `${slugify(first)}.${slugify(last)}@${pick(MAIL_HOSTS)}`;
    let n = 1;
    while (usedEmails.has(email)) email = `${slugify(first)}.${slugify(last)}${++n}@${pick(MAIL_HOSTS)}`;
    usedEmails.add(email);

    // Se anotaron en cualquier momento del período (o justo antes de arrancar).
    const offset = Math.floor((rand() * 1.15 - 0.15) * (now.getTime() - start.getTime()));
    const withGoogle = rand() < 0.3;
    customers.push({
      id: makeId(),
      name: `${first} ${last}`,
      email,
      phone: `0358 15${randInt(4000000, 4999999)}`,
      passwordHash: withGoogle ? null : passwordHash,
      googleId: withGoogle ? `sim-${makeId()}` : null,
      createdAt: new Date(start.getTime() + offset),
    });
  }
  customers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  await prisma.customer.createMany({ data: customers });

  // ── 3. Cuatro meses de ventas ──
  const usedNumbers = new Set<string>((await prisma.order.findMany({ select: { orderNumber: true } })).map((o) => o.orderNumber));
  const orders: SimOrder[] = [];
  const items: SimItem[] = [];
  let closedDays = 0;
  let openDays = 0;

  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= now) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    const dow = cursor.getUTCDay(); // 0 = domingo
    const key = dayKey(y, m, d);
    cursor.setUTCDate(cursor.getUTCDate() + 1);

    if (dow === 0 || HOLIDAYS.has(key)) {
      closedDays++;
      continue;
    }
    openDays++;

    const isSaturday = dow === 6;

    // Reposición del lunes a la mañana, antes de abrir.
    if (dow === 1) {
      for (const p of pool) {
        if (p.stock < p.target * 0.4) p.stock = p.target + randInt(0, Math.ceil(p.target * 0.15));
      }
    }

    // Cuántas ventas tiene el día.
    const dowFactor = [1, 1.15, 1.0, 0.98, 1.02, 1.12, 1][dow]!;
    const paydayFactor = d <= 5 ? 1.2 : d >= 10 && d <= 20 ? 0.9 : 1;
    const weather = rand() < 0.08 ? 0.55 : 1; // día de lluvia: casi no entra nadie
    const factor = (MONTH_FACTOR[m] ?? 1) * dowFactor * paydayFactor * weather * (0.8 + rand() * 0.4);
    const count = Math.max(1, Math.round((isSaturday ? ORDERS_SATURDAY : ORDERS_WEEKDAY) * factor));

    for (let i = 0; i < count; i++) {
      const at = arDate(y, m, d, openingMinute(isSaturday), randInt(0, 59));
      if (at > now) continue; // el día de hoy solo llega hasta la hora actual

      const monthsAgo = (now.getTime() - at.getTime()) / (30 * 24 * 3600 * 1000);

      // Renglones del pedido.
      const lineCount = weighted([
        { item: 1, weight: 50 }, { item: 2, weight: 25 }, { item: 3, weight: 13 },
        { item: 4, weight: 7 }, { item: 5, weight: 4 }, { item: 7, weight: 1 },
      ]);
      const chosen = new Set<string>();
      const lines: SimItem[] = [];
      const orderId = makeId();

      for (let k = 0; k < lineCount; k++) {
        const available = pool.filter((p) => p.stock > 0 && !chosen.has(p.id));
        if (available.length === 0) break;
        const prod = weighted(available.map((p) => ({ item: p, weight: p.pop })));
        chosen.add(prod.id);

        const quantity = Math.min(quantityFor(prod.price), prod.stock);
        const unitPrice = historicPrice(prod.price, monthsAgo);
        prod.stock -= quantity;
        prod.sold += quantity;
        lines.push({
          id: makeId(), orderId, productId: prod.id, productName: prod.name,
          unitPrice, quantity, lineTotal: unitPrice * quantity,
        });
      }
      if (lines.length === 0) continue;

      // Entrega, pago y totales (misma cuenta que hace el checkout real).
      const isDelivery = rand() < 0.32;
      const zone = isDelivery ? weighted([
        { item: "centro" as const, weight: 40 }, { item: "norte" as const, weight: 25 },
        { item: "sur" as const, weight: 25 }, { item: "afueras" as const, weight: 10 },
      ]) : null;
      const payment = weighted([
        { item: "cash", weight: 42 }, { item: "mercadopago", weight: 36 }, { item: "transfer", weight: 22 },
      ]);
      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const shippingCost = zone ? SHIPPING[zone] : 0;
      const discount = payment === "transfer" ? Math.round(subtotal * 0.05) : 0;

      // Quién compra: cuenta registrada (ya existente a esa fecha) o invitado.
      const eligible = customers.filter((c) => c.createdAt <= at);
      const account = eligible.length > 0 && rand() < ACCOUNT_ORDER_SHARE ? pick(eligible) : null;
      const guestName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

      let orderNumber = "";
      do {
        orderNumber = `FT-${at.getUTCFullYear()}-${randInt(10000, 99999)}`;
      } while (usedNumbers.has(orderNumber));
      usedNumbers.add(orderNumber);

      const ageDays = (now.getTime() - at.getTime()) / 86400000;
      const status = statusFor(ageDays);
      // Cancelar repone el stock, igual que hace el panel de administración.
      if (status === "CANCELLED") for (const l of lines) {
        const p = pool.find((x) => x.id === l.productId)!;
        p.stock += l.quantity;
        p.sold -= l.quantity;
      }

      const closeHours = status === "DELIVERED" ? randInt(2, 48) : status === "CANCELLED" ? randInt(1, 20) : 0;
      const updatedAt = new Date(Math.min(now.getTime(), at.getTime() + closeHours * 3600 * 1000));

      orders.push({
        id: orderId,
        orderNumber,
        customerName: account?.name ?? guestName,
        customerEmail: account?.email ?? `${slugify(guestName)}@${pick(MAIL_HOSTS)}`,
        customerPhone: account?.phone ?? `0358 15${randInt(4000000, 4999999)}`,
        deliveryMethod: zone ? "delivery" : "pickup",
        zone,
        address: zone ? `${pick(STREETS)} ${randInt(100, 2900)}` : null,
        paymentMethod: payment,
        status,
        subtotal,
        shippingCost,
        discount,
        total: subtotal + shippingCost - discount,
        notes: rand() < 0.15 ? pick(NOTES) : null,
        customerId: account?.id ?? null,
        createdAt: at,
        updatedAt,
      });
      items.push(...lines);
    }
  }

  orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (let i = 0; i < orders.length; i += 400) {
    await prisma.order.createMany({ data: orders.slice(i, i + 400) });
  }
  for (let i = 0; i < items.length; i += 800) {
    await prisma.orderItem.createMany({ data: items.slice(i, i + 800) });
  }

  // ── 4. Stock final y ranking de más vendidos ──
  const maxSold = Math.max(1, ...pool.map((p) => p.sold));
  for (const p of pool) {
    await prisma.product.update({
      where: { id: p.id },
      data: { stockQty: p.stock, salesRank: Math.round((p.sold / maxSold) * 100) },
    });
  }

  writeFileSync(IDS_FILE, JSON.stringify({
    generatedAt: new Date().toISOString(),
    orderIds: orders.map((o) => o.id),
    customerIds: customers.map((c) => c.id),
  }));

  const sold = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = sold.reduce((s, o) => s + o.total, 0);
  const fmt = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

  console.log(`\n✅ Simulación lista (${start.toLocaleDateString("es-AR")} → ${now.toLocaleDateString("es-AR")})`);
  console.log(`   Catálogo:        ${pool.length} productos activos (${CATALOG.length} nuevos)`);
  console.log(`   Días abiertos:   ${openDays} (${closedDays} domingos y feriados cerrados)`);
  console.log(`   Pedidos:         ${orders.length} · ${items.length} renglones`);
  console.log(`   Ventas (sin canceladas): ${sold.length} · facturado ${fmt(revenue)}`);
  console.log(`   Ticket promedio: ${fmt(Math.round(revenue / sold.length))}`);
  console.log(`   Clientes nuevos: ${customers.length} (contraseña de prueba: cliente1234)`);
  console.log(`   Sin stock hoy:   ${pool.filter((p) => p.stock === 0).length} productos\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
