/**
 * Comprobación de humo: verifica que todas las rutas públicas responden.
 * Uso:  node scripts/smoke.mjs [http://localhost:3000]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const routes = [
  ["/", 200],
  ["/juegos", 200],
  ["/juegos?plataforma=ps5&difMax=4", 200],
  ["/juegos?perdibles=1", 200],
  ["/juegos?q=spider", 200],
  ["/juegos?orden=platinum_hours_asc", 200],
  ["/juegos/ghost-of-tsushima", 200],
  ["/juegos/cyberpunk-2077", 200],
  ["/juegos/bloodborne", 200],
  ["/comparar", 200],
  ["/comparar?juegos=god-of-war,cyberpunk-2077,bloodborne", 200],
  ["/categorias", 200],
  ["/categorias/accion", 200],
  ["/categorias/soulslike", 200],
  ["/guias", 200],
  ["/guias/platino-god-of-war-ragnarok", 200],
  ["/acerca-de", 200],
  ["/login", 200],
  ["/registro", 200],
  ["/sitemap.xml", 200],
  ["/robots.txt", 200],
  ["/api/search?q=blood", 200],
  ["/admin", 307], // redirige al login si no hay sesión
  ["/juegos/no-existe-este", 404],
];

let failures = 0;
for (const [route, expected] of routes) {
  const res = await fetch(BASE + route, { redirect: "manual" });
  const ok = res.status === expected;
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALLA"} ${String(res.status).padEnd(4)} ${route}`);
}

console.log(
  failures === 0
    ? `\nTodas las ${routes.length} rutas responden correctamente.`
    : `\n${failures} ruta(s) con respuesta inesperada.`,
);
process.exitCode = failures === 0 ? 0 : 1;
