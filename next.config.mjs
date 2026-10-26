/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// Aviso temprano de configuración (Vercel)
// ---------------------------------------------------------------------------
// Las funciones de Vercel se ejecutan con el sistema de ficheros de sólo
// lectura, así que la base SQLite local (`file:./dev.db`) no se puede abrir
// allí. Sin esta comprobación el síntoma es un «unable to open database file»
// repetido en los registros, sin pistas sobre la causa.
const vercelBuild = Boolean(process.env.VERCEL);
const isBuildCommand = process.argv.some((arg) => arg === "build");
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const localDatabase = databaseUrl === "" || databaseUrl.startsWith("file:");

if (isBuildCommand && vercelBuild && localDatabase) {
  console.warn(
    [
      "",
      "=".repeat(78),
      "  GAMES HUNTER — AVISO DE CONFIGURACIÓN",
      "=".repeat(78),
      "  DATABASE_URL no apunta a una base remota, y Vercel no puede usar SQLite local.",
      "",
      "  Configura en Settings → Environment Variables (Production y Preview):",
      "    DATABASE_URL         = libsql://<tu-base>.turso.io",
      "    DATABASE_AUTH_TOKEN  = <token de `turso db tokens create <base>`>",
      "    SESSION_SECRET       = <64 caracteres aleatorios>",
      "",
      "  El despliegue se generará, pero la web mostrará un error hasta entonces.",
      "  Comprueba el estado en /api/health tras desplegar.",
      "=".repeat(78),
      "",
    ].join("\n"),
  );
}

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // Cabeceras de seguridad básicas. Ajusta la CSP cuando sirvas desde tu propio
  // dominio con fuentes y scripts externos.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  images: {
    // Las portadas actuales se generan en servidor. Al añadir imágenes reales,
    // sire aquí los dominios de origen (PlayStation Store, etc.).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },

  /**
   * `database/schema.sql` se lee en tiempo de ejecución para poder aplicar el
   * esquema automáticamente. Sin esto, Next no lo empaquetaría en la función
   * serverless de Vercel y el auto-esquema fallaría en el primer arranque.
   */
  outputFileTracingIncludes: {
    "/*": ["./database/**/*.sql"],
  },

  /**
   * Drivers de base de datos fuera del bundle.
   *
   * - `@libsql/client`: en Vercel se usa la versión HTTP (JS puro). Se deja
   *   externa para que el runtime la resuelva desde node_modules y no haya que
   *   empaquetar el binding nativo `libsql`, que no existe en el runtime.
   * - `node:sqlite` solo se usa en desarrollo, y se importa de forma dinámica,
   *   así que nunca se carga en Vercel.
   */
  serverExternalPackages: ["@libsql/client", "bcryptjs"],

  experimental: {
    // El proyecto está pensado para crecer: activa Server Components parciales
    // cuando el catálogo supere las decenas de miles de filas.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;