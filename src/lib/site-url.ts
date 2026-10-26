/**
 * URL pública del sitio.
 *
 * Antes de este cambio, si `NEXT_PUBLIC_SITE_URL` no estaba definida en Vercel
 * todas las URLs canónicas, Open Graph y el sitemap salían como
 * `http://localhost:3000`. Vercel inyecta `VERCEL_PROJECT_PRODUCTION_URL` y
 * `VERCEL_URL` en cada despliegue, así que se usan como reserva automática y no
 * hace falta configurar nada para tener URLs correctas.
 */
const LOCAL = "http://localhost:3000";

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Origen público del sitio, sin barra final. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalize(explicit);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ?? process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${normalize(vercel).replace(/^https?:\/\//, "")}`;

  return LOCAL;
}

/** Nombre visible del proyecto. */
export function siteName(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Games Hunter";
}

/** Une la URL del sitio con una ruta interna. */
export function absoluteUrl(pathname: string): string {
  const base = siteUrl();
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
