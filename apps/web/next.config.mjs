/**
 * Content-Security-Policy.
 *
 * `script-src` incluye 'unsafe-inline' porque Next inyecta scripts inline en
 * cada página (los datos de hidratación) y next-themes agrega el suyo para
 * pintar el tema antes del primer frame. La alternativa —un nonce por request—
 * obliga a renderizar TODO dinámicamente y perdería el prerenderizado del
 * catálogo, que es de donde sale el TTFB actual. Sin ese endurecimiento, lo que
 * la política igual cierra es sustancial: no se puede cargar un script de otro
 * dominio, ni mandar datos a otro origen (`connect-src`), ni reescribir los
 * links relativos con un <base> ajeno, ni apuntar un formulario afuera, ni
 * embeber la tienda en un iframe para clickjacking.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // data: y blob: los usa el preview de la imagen al subirla desde el panel.
  "img-src 'self' data: blob:",
  // next/font descarga Inter en el build y la sirve desde el propio dominio.
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ferretodo/ui", "@ferretodo/types"],
  // Sin remotePatterns a proposito: las fotos de producto se sirven desde el
  // disco del propio servidor (/uploads). Habilitar un host externo aca deja
  // que cualquiera, sin autenticarse, haga que el optimizador descargue y
  // decodifique una imagen elegida por el via /_next/image?url=...
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
