/**
 * Aplica database/schema.sql a la base de datos configurada en DATABASE_URL.
 * Es idempotente: el esquema usa IF NOT EXISTS, asi que se puede repetir.
 *
 *   node scripts/db-push.mjs           # crea/actualiza el esquema
 *   node scripts/db-push.mjs --reset   # borra el fichero antes (SQLite)
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const reset = process.argv.includes("--reset");
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const file = url.startsWith("file:") ? url.slice("file:".length) : url;
const dbPath = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);

if (reset && dbPath.endsWith(".db")) {
  for (const suffix of ["-wal", "-shm", ""]) {
    const p = dbPath + suffix;
    if (!fs.existsSync(p)) continue;
    try {
      fs.rmSync(p);
      console.log(`  borrado ${path.basename(p)}`);
    } catch (e) {
      console.error(
        `  no se pudo borrar ${path.basename(p)} (${e.code}). ` +
          `Cierra el servidor (Ctrl+C) y vuelve a ejecutar: npm run db:reset`,
      );
      process.exit(1);
    }
  }
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

const schema = fs.readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");
db.exec(schema);

const tables = db
  .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
  .get();
const indexes = db
  .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'")
  .get();

console.log(`Base de datos lista: ${dbPath}`);
console.log(`  ${tables.n} tablas, ${indexes.n} índices`);
db.close();
