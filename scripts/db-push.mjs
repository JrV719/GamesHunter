/**
 * Aplica database/schema.sql a la base de datos configurada en DATABASE_URL.
 * Es idempotente: el esquema usa IF NOT EXISTS, asi que se puede repetir.
 *
 *   node scripts/db-push.mjs                       # crea/actualiza el esquema
 *   node scripts/db-push.mjs --reset               # borra el fichero antes (sólo SQLite)
 *   node scripts/db-push.mjs --apply export.sql    # aplica además un volcado de datos
 *
 * Soporta los dos motores de GamesHunter:
 *   file:./dev.db   -> SQLite local (node:sqlite)
 *   libsql://...    -> Turso remoto (necesita DATABASE_AUTH_TOKEN)
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dbToken, dbUrl, resolvedUrl } from "./env-db.mjs";

const reset = process.argv.includes("--reset");
const applyIndex = process.argv.indexOf("--apply");
const applyFile = applyIndex > -1 ? process.argv[applyIndex + 1] : null;
const url = resolvedUrl();
const authToken = dbToken();
const isRemote = !url.startsWith("file:") && url !== "";
const schema = fs.readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");

/** Cuenta tablas e índices (funciona igual en SQLite y en Turso). */
async function count(client) {
  const t = await client.execute({
    sql: "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    args: [],
  });
  const i = await client.execute({
    sql: "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'",
    args: [],
  });
  return {
    tables: Number(t.rows[0]?.n ?? 0),
    indexes: Number(i.rows[0]?.n ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Turso / libSQL remoto
// ---------------------------------------------------------------------------
async function pushRemote() {
  if (!authToken.value) {
    console.error(
      `${dbUrl().name ?? "DATABASE_URL"} apunta a un servidor remoto pero falta el token.\n` +
        "Define DATABASE_AUTH_TOKEN (o TURSO_AUTH_TOKEN) con el token de Turso.",
    );
    process.exit(1);
  }

  if (reset) {
    console.log("  --reset no se aplica en bases remotas (no se borra nada).");
  }

  const { createClient } = await import("@libsql/client/http");
  const client = createClient({ url, authToken: authToken.value });

  try {
    // executeMultiple ejecuta un script completo con varias sentencias.
    await client.executeMultiple(schema);

    if (applyFile) {
      await client.executeMultiple(fs.readFileSync(path.resolve(applyFile), "utf8"));
      console.log(`  volcado aplicado: ${applyFile}`);
    }

    const { tables, indexes } = await count(client);
    console.log(`Base de datos lista: ${url}`);
    console.log(`  ${tables} tablas, ${indexes} índices`);
  } catch (e) {
    const detail = `${e?.code ?? ""} ${e?.message ?? e}`.trim();
    console.error(`\n  No se pudo aplicar el esquema en ${url}`);
    console.error(`  Detalle: ${detail}`);
    if (/404|not found/i.test(detail)) {
      console.error("  Turso no encuentra esa base: revisa la URL exacta del panel.");
    } else if (/401|403|AUTH|unauthorized|forbidden/i.test(detail)) {
      console.error("  El token no es válido o no tiene permisos de escritura.");
    } else if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(detail)) {
      console.error("  No hay conectividad con el host de la base.");
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// SQLite local
// ---------------------------------------------------------------------------
function pushLocal() {
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
  db.exec(schema);

  if (applyFile) {
    db.exec(fs.readFileSync(path.resolve(applyFile), "utf8"));
    console.log(`  volcado aplicado: ${applyFile}`);
  }

  const tables = db
    .prepare(
      "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )
    .get();
  const indexes = db
    .prepare(
      "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'",
    )
    .get();

  console.log(`Base de datos lista: ${dbPath}`);
  console.log(`  ${tables.n} tablas, ${indexes.n} índices`);
  db.close();
}

if (isRemote) {
  await pushRemote();
} else {
  pushLocal();
}