/**
 * Resolución de las variables de base de datos para los scripts de Node.
 *
 * Debe coincidir con `src/lib/db.ts`: se aceptan tanto los nombres propios del
 * proyecto (`DATABASE_URL` / `DATABASE_AUTH_TOKEN`) como los que inyecta la
 * integración de Turso en el Marketplace de Vercel (`TURSO_DATABASE_URL` /
 * `TURSO_AUTH_TOKEN`). Se limpian espacios y comillas porque al pegar desde un
 * `.env` es fácil arrastrarlas.
 */
const URL_VARS = ["DATABASE_URL", "TURSO_DATABASE_URL", "LIBSQL_URL", "LIBSQL_DATABASE_URL"];
const TOKEN_VARS = [
  "DATABASE_AUTH_TOKEN",
  "TURSO_AUTH_TOKEN",
  "LIBSQL_AUTH_TOKEN",
  "TURSO_DB_TOKEN",
];

function read(names) {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined) continue;
    const value = raw.trim().replace(/^["']/, "").replace(/["']$/, "").trim();
    if (value) return { value, name };
  }
  return { value: "", name: null };
}

/** URL de conexión y nombre de la variable de la que procede. */
export function dbUrl() {
  return read(URL_VARS);
}

/** Token de Turso y nombre de la variable de la que procede. */
export function dbToken() {
  return read(TOKEN_VARS);
}

/** URL efectiva, con el fallback de desarrollo (`prisma/dev.db`). */
export function resolvedUrl() {
  return dbUrl().value || "file:./dev.db";
}
