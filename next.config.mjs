/** @type {import('next').NextConfig} */
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

  // `node:sqlite` es un módulo nativo: nunca debe intentar empaquetarlo.
  serverExternalPackages: [],
  experimental: {
    // El proyecto está pensado para crecer: activa Server Components parciales
    // cuando el catálogo supere las decenas de miles de filas.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
