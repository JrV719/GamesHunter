/**
 * Verifica la conexión a la base configurada e imprime el contenido real.
 *
 *   npm run db:verify                 # base local (prisma/dev.db)
 *   npm run db:verify                 # con DATABASE_URL/TURSO_DATABASE_URL en el entorno
 *
 * Sirve para confirmar, antes de desplegar, que Turso responde y que los datos
 * llegaron. Sale con código 1 si no conecta o si el catálogo está vacío, para
 * poder usarlo en una comprobación automática.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dbToken, dbUrl, resolvedUrl } from "./env-db.mjs";

const TABLES = ["games", "trophies", "guides", "categories", "users", "posts"];

const url = resolvedUrl();
const isRemote = !url.startsWith("file:");

/** Oculta credenciales que pudieran venir embebidas en la URL. */
function safeHost(value) {
  try {
    return new URL(value).host;
  } catch {
    return value.replace(/\/\/[^/]*@/, "//");
  }
}

async function countsRemote() {
  const token = dbToken();
  const { createClient } = await import("@libsql/client/http");
  const client = createClient({ url, authToken: token.value || undefined });
  // Comprobación previa: distingue «no conecta» de «conecta pero sin esquema».
  await client.execute({ sql: "SELECT 1", args: [] });
  const out = {};
  for (const table of TABLES) {
    try {
      const rs = await client.execute({ sql: `SELECT COUNT(*) AS n FROM ${table}`, args: [] });
      out[table] = Number(rs.rows[0]?.n ?? 0);
    } catch (e) {
      out[table] = `ERROR: ${e.message}`;
    }
  }
  return out;
}

function countsLocal() {
  const file = url.slice("file:".length);
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);
  if (!fs.existsSync(abs)) {
    throw new Error(`no existe el fichero ${abs}. Ejecuta antes: npm run setup`);
  }
  const db = new DatabaseSync(abs, { readOnly: true });
  const out = {};
  for (const table of TABLES) {
    try {
      out[table] = Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
    } catch (e) {
      out[table] = `ERROR: ${e.message}`;
    }
  }
  db.close();
  return out;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  GAMES HUNTER — VERIFICACIÓN DE BASE DE DATOS");
  console.log("=".repeat(60));
  console.log(`  Motor:    ${isRemote ? "Turso / libSQL (remoto)" : "SQLite local (node:sqlite)"}`);
  console.log(`  Destino:  ${isRemote ? safeHost(url) : url}`);

  const src = dbUrl();
  if (src.name) console.log(`  Variable: ${src.name}`);
  if (isRemote) {
    const token = dbToken();
    console.log(
      `  Token:    ${token.value ? `definido (${token.name})` : "NO DEFINIDO"}`,
    );
    if (!token.value) {
      console.error("\n  Falta el token. Define DATABASE_AUTH_TOKEN o TURSO_AUTH_TOKEN.");
      process.exit(1);
    }
  }

  let counts;
  try {
    counts = isRemote ? await countsRemote() : countsLocal();
  } catch (e) {
    console.error(`\n  No se pudo conectar: ${e.message}`);
    process.exit(1);
  }

  console.log("-".repeat(60));
  for (const table of TABLES) {
    const value = counts[table];
    console.log(`  ${table.padEnd(12)} ${typeof value === "number" ? value : value}`);
  }
  console.log("-".repeat(60));

  const games = counts.games;
  if (typeof games !== "number") {
    console.error(`\n  No se pudo leer \`games\`: ${games}`);
    const failing = TABLES.filter((t) => typeof counts[t] !== "number").length;
    console.error(
      failing === TABLES.length
        ? "  Fallan TODAS las tablas: es un problema de conexión o del token, no del esquema."
        : "  Sólo fallan algunas tablas: probablemente falta aplicar database/schema.sql.",
    );
    process.exit(1);
  }
  if (games === 0) {
    console.error(
      "\n  La base conecta pero está VACÍA. Carga los datos con:\n" +
        "    npm run db:export\n" +
        "    npm run db:push -- --apply prisma/export.sql",
    );
    process.exit(1);
  }

  console.log(`\n  OK: conexión correcta y ${games} juegos en el catálogo.`);
}

main();
