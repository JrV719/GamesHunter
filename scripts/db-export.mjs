/**
 * Exporta el contenido de la base SQLite local a un fichero SQL portable.
 *
 * Pensado para llevar los datos de demostración (o un catálogo ya trabajado) a
 * una base Turso en producción, donde no se puede simplemente copiar el
 * fichero .db:
 *
 *   1. npm run db:seed
 *   2. npm run db:export                    -> escribe prisma/export.sql
 *   3. DATABASE_URL="libsql://..." npm run db:push -- --apply prisma/export.sql
 *
 * Sólo genera INSERTs: el esquema (CREATE TABLE, índices) lo pone `db:push`.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const outIndex = process.argv.indexOf("--out");
const outPath =
  outIndex > -1 && process.argv[outIndex + 1]
    ? process.argv[outIndex + 1]
    : path.join(process.cwd(), "prisma", "export.sql");

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:")) {
  console.error(
    "db:export lee la base SQLite local. Apunta DATABASE_URL a un fichero file:... " +
      "o quita la variable para usar prisma/dev.db.",
  );
  process.exit(1);
}

const file = url.slice("file:".length);
const dbPath = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);
if (!fs.existsSync(dbPath)) {
  console.error(`No existe la base ${dbPath}. Ejecuta antes: npm run db:seed`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

/** Tablas en orden de dependencia: primero las que se referencian a otras. */
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all()
  .map((r) => String(r.name));

function quote(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "bigint") return String(v);
  const s = String(v);
  return `'${s.replace(/'/g, "''")}'`;
}

const lines = [
  "-- GamesHunter: volcado de contenido.",
  "-- Generado con `npm run db:export`. Sólo INSERTs: el esquema lo crea db:push.",
  "-- Para aplicarlo en Turso: npm run db:push -- --apply prisma/export.sql",
  "PRAGMA foreign_keys = OFF;",
  "",
];

let total = 0;
for (const table of tables) {
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  if (rows.length === 0) continue;

  const cols = db.prepare(`SELECT * FROM "${table}" LIMIT 0`).all();
  void cols;

  lines.push(`-- ${table} (${rows.length})`);
  const batch = rows.map((row) => {
    const r = row as Record<string, unknown>;
    const names = Object.keys(r);
    const values = names.map((n) => quote(r[n])).join(", ");
    return `INSERT INTO "${table}" (${names.map((n) => `"${n}"`).join(",")}) VALUES (${values});`;
  });
  lines.push(...batch);
  lines.push("");
  total += rows.length;
}

db.close();

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Volcado escrito: ${outPath}`);
console.log(`  ${total} filas en ${tables.length} tablas`);