// Se ejecuta una vez al arrancar el servidor (Next.js instrumentation).
// Todo el trabajo con Node (fs, Prisma) vive en instrumentation-node.ts para
// que este archivo también compile en el runtime edge (middleware).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    await import("./instrumentation-node");
  }
}
