import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// ============================================================================
// Capa de base de datos
// ----------------------------------------------------------------------------
// GamesHunter usa `node:sqlite`, el modulo de SQLite integrado en Node 22+.
// Ventajas frente a un ORM con binario nativo:
//   - cero dependencias nativas (funciona en cualquier plataforma y arquitectura)
//   - no hay paso de generacion de cliente ni paso de migracion obligatorio
//   - el SQL es explicito y portable a PostgreSQL
// El esquema (database/schema.sql) esta normalizado; ver prisma/schema.prisma
// para la version equivalent en formato Prisma (util al migrar a Postgres).
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __gameshunterDb: DatabaseSync | undefined;
}

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const file = url.startsWith("file:") ? url.slice("file:".length) : url;
  // Las rutas relativas en .env son relativas a la carpeta prisma/
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

function create(): DatabaseSync {
  const database = new DatabaseSync(resolveDbPath());
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  // Margen generoso: varias peticiones pueden coincidir y SQLite serializa.
  database.exec("PRAGMA busy_timeout = 10000;");
  return database;
}

export function getDb(): DatabaseSync {
  if (!global.__gameshunterDb) {
    global.__gameshunterDb = create();
  }
  return global.__gameshunterDb;
}

/** Normaliza los tipos que node:sqlite devuelve como BigInt/Buffer. */
function normalizeValue<T>(value: unknown): T {
  if (typeof value === "bigint") return Number(value) as T;
  if (value instanceof Uint8Array) return value as unknown as T;
  return value as T;
}

function normalizeRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out as T;
}

export type SqlParam = string | number | boolean | null | Uint8Array;

/** node:sqlite no acepta booleanos: se convierten a 0/1. */
function toInput(params: SqlParam[]): (string | number | bigint | null | Uint8Array)[] {
  return params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
}

/** Devuelve todas las filas. */
export function all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): T[] {
  const stmt = getDb().prepare(sql);
  return (stmt.all(...toInput(params)) as Record<string, unknown>[]).map((r) => normalizeRow<T>(r));
}

/** Devuelve la primera fila o null. */
export function one<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): T | null {
  const row = getDb().prepare(sql).get(...toInput(params)) as Record<string, unknown> | undefined;
  return row ? normalizeRow<T>(row) : null;
}

/** Ejecuta una escritura. Devuelve changes y lastInsertRowid. */
export function run(sql: string, params: SqlParam[] = []) {
  const r = getDb().prepare(sql).run(...toInput(params));
  return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
}

/** Ejecuta varios INSERT en una transacción. */
export function runMany(statements: { sql: string; params?: SqlParam[] }[]) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    let count = 0;
    for (const st of statements) {
      const r = db.prepare(st.sql).run(...toInput(st.params ?? []));
      count += Number(r.changes);
    }
    db.exec("COMMIT");
    return count;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Agrupa condicionales en una transacción. */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Aplica database/schema.sql (idempotente: usa IF NOT EXISTS). */
export function applySchema() {
  const file = path.join(process.cwd(), "database", "schema.sql");
  const sql = fs.readFileSync(file, "utf8");
  getDb().exec(sql);
}

// ----------------------------------------------------------------------------
// Helpers de construcción de consultas
// ----------------------------------------------------------------------------

/** 'a', 'b' -> "('a','b')" */
export function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(",");
}

/** Filtro "key IN (...)" seguro contra inyección. */
export function inClause(column: string, values: readonly string[]): string {
  return `${column} IN (${placeholders(values)})`;
}

/** Construye WHERE a partir de un objeto; ignora valores undefined/null. */
export type Where = Record<string, string | number | boolean | null | undefined>;

export function buildWhere(
  conditions: Where[],
  params: SqlParam[],
  prefix = " WHERE ",
): string {
  const parts: string[] = [];
  for (const cond of conditions) {
    for (const [expr, value] of Object.entries(cond)) {
      if (value === undefined) continue;
      if (value === null) {
        parts.push(`(${expr}) IS NULL`);
      } else if (typeof value === "boolean") {
        parts.push(`(${expr}) = ${value ? 1 : 0}`);
      } else {
        parts.push(`(${expr}) = ?`);
        params.push(value as SqlParam);
      }
    }
  }
  if (parts.length === 0) return "";
  return prefix + parts.join(" AND ");
}

export { normalizeValue };
