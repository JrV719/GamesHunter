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
  ["/comunidad", 200],
  ["/comunidad?tema=platinos", 200],
  ["/comunidad?tipo=opinion", 200],
  ["/comunidad?tipo=opinion&orden=populares", 200],
  ["/comunidad?q=platino&pagina=1", 200],
  ["/acerca-de", 200],
  ["/login", 200],
  ["/registro", 200],
  ["/sitemap.xml", 200],
  ["/robots.txt", 200],
  ["/api/health", 200],
  ["/api/search?q=blood", 200],
  // Sin sesión: la comunidad se lee, el panel y la escritura redirigen.
  ["/admin", 307],
  ["/admin/comunidad", 307],
  ["/admin/usuarios", 307],
  ["/comunidad/nueva", 307],
  ["/perfil", 307],
  ["/juegos/no-existe-este", 404],
  ["/comunidad/no-existe", 404],
  ["/usuarios/no-existe", 404],
  // Los endpoints de comunidad exigen sesión.
  ["/comunidad/no-existe/editar", 307],
];

// Rutas que sólo deben responder 200 o 307 según haya sesión.
let failures = 0;
for (const [route, expected] of routes) {
  const res = await fetch(BASE + route, { redirect: "manual" });
  const ok = res.status === expected;
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FALLA"} ${String(res.status).padEnd(4)} ${route}`);
}

// Comprobaciones de autorización: sin sesión nadie puede votar ni denunciar.
const unauth = [
  ["POST", "/api/community"],
  ["PUT", "/api/community"],
];
for (const [method, route] of unauth) {
  const res = await fetch(BASE + route, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetType: "post", targetId: "x", reason: "spam" }),
    redirect: "manual",
  });
  const ok = res.status === 401;
  if (!ok) failures++;
  console.log(
    `${ok ? "OK  " : "FALLA"} ${String(res.status).padEnd(4)} ${method} ${route} (sin sesión → 401)`,
  );
}

const totalChecks = routes.length + unauth.length;
console.log(
  failures === 0
    ? `\nTodas las ${totalChecks} comprobaciones responden correctamente.`
    : `\n${failures} comprobación(es) con respuesta inesperada.`,
);
process.exitCode = failures === 0 ? 0 : 1;
