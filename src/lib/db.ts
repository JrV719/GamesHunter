import "server-only";
import fs from "node:fs";
import path from "node:path";

// ============================================================================
// Capa de base de datos (doble driver)
// ----------------------------------------------------------------------------
// GamesHunter habla un único SQL, con dos motores detrás:
//
//   1. `node:sqlite`   -> desarrollo local (archivo en prisma/dev.db).
//                         Cero dependencias nativas, cero instalación.
//   2. Turso / libSQL  -> producción y Vercel. Mismo dialecto SQLite pero
//                         servido por HTTP, así que NINGUNA consulta del
//                         proyecto cambia al desplegar. Es un paquete JS puro:
//                         no hay binarios nativos que empaquetar.
//
// Se elige el motor a partir de DATABASE_URL:
//   file:./dev.db | (sin definir)  -> SQLite local
//   libsql://... | https://...     -> Turso (Vercel)
//
// Por eso todas las funciones de este módulo son asíncronas. Mantienen la
// misma firma lógica que antes (`all`, `one`, `run`...), así que el resto del
// proyecto solo necesita `await`.
// ============================================================================

export type DbKind = "sqlite" | "libsql";

export type SqlParam = string | number | boolean | null | Uint8Array;

type Row = Record<string, unknown>;

/** Normaliza los tipos que los motores devuelven como BigInt. */
function normalizeRow<T>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out as T;
}

export function normalizeValue<T>(value: unknown): T {
  if (typeof value === "bigint") return Number(value) as T;
  return value as T;
}

/** Ningún motor acepta booleanos: se convierten a 0/1. */
function toInput(params: SqlParam[]): (string | number | null | Uint8Array)[] {
  return params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
}

// ----------------------------------------------------------------------------
// Selección de motor
// ----------------------------------------------------------------------------

function resolveDbUrl(): string {
  return process.env.DATABASE_URL?.trim() ?? "file:./dev.db";
}

export function dbKind(): DbKind {
  const url = resolveDbUrl();
  return url === "" || url.startsWith("file:") ? "sqlite" : "libsql";
}

/** ¿Estamos hablando con una base remota (Turso) o con el archivo local? */
export function isRemoteDb(): boolean {
  return dbKind() === "libsql";
}

/** Descripción legible del motor, para la página "Acerca de" y el README. */
export function dbDescription(): string {
  if (dbKind() === "sqlite") return "SQLite local (node:sqlite)";
  const url = resolveDbUrl();
  try {
    return `Turso/libSQL (${new URL(url).host})`;
  } catch {
    return "Turso/libSQL remoto";
  }
}

// ----------------------------------------------------------------------------
// Diagnóstico de configuración
// ----------------------------------------------------------------------------

/**
 * La base de datos no está disponible. No es un fallo de la aplicación sino de
 * configuración del despliegue, así que se distingue del resto de errores para
 * poder mostrar un mensaje accionable en lugar de una pantalla en blanco.
 */
export class DatabaseUnavailableError extends Error {
  readonly hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.hint = hint;
    // Se escribe en stderr a propósito: es lo que aparece en los Runtime Logs
    // de Vercel, donde se puede ver por qué la web no arranca.
    console.error(`[GamesHunter] Base de datos no disponible: ${message}\n${hint}`);
  }
}

/**
 * ¿El código se está ejecutando en una función serverless (Vercel)?
 *
 * Ahí el sistema de ficheros es de sólo lectura y no hay disco persistente, así
 * que un SQLite local no se puede ni crear ni abrir. Por eso el valor por
 * defecto `file:./dev.db` sólo es válido en desarrollo.
 */
export function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

/** ¿Estamos dentro de `next build`? Next lo expone en `NEXT_PHASE`. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** ¿`DATABASE_URL` apunta a un motor local de ficheros? */
export function usesLocalFile(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return !url || url.startsWith("file:");
}

const CONFIG_HINT = [
  "Configura en el proyecto de Vercel (Settings → Environment Variables):",
  "  DATABASE_URL          = libsql://<tu-base>.turso.io",
  "  DATABASE_AUTH_TOKEN   = <token de `npx turso db tokens create <base>`>",
  "SESSION_SECRET también es obligatorio en producción para poder iniciar sesión.",
  "Ver README.md §3 «Despliegue en Vercel».",
].join("\n");

/**
 * Valida la configuración ANTES de tocar el disco o la red.
 *
 * Sin esto, una variable ausente hace que `sqliteHandle()` intente crear
 * `prisma/dev.db` dentro de `/var/task` (sólo lectura) y revienta con un
 * `EROFS` críptico que en producción se ve como «Application error».
 *
 * Durante el build NO se aborta: se avisa y se deja compilar. Así el despliegue
 * llega a publicarse y `/api/health` puede explicar qué falta, en vez de dejar
 * al usuario con un «Build failed» sin forma de diagnosticarlo. En tiempo de
 * petición sí se lanza, para no servir páginas vacías como si todo fuera bien.
 */
function assertDbConfigured(): void {
  if (!isServerlessRuntime()) return;
  if (!usesLocalFile()) return;

  if (isBuildPhase()) {
    // El aviso ya lo imprime next.config.mjs al arrancar el build; aquí sólo
    // se evita abortar para que el despliegue llegue a publicarse.
    return;
  }

  throw new DatabaseUnavailableError(
    "DATABASE_URL no está configurada: en Vercel no puede usarse la base SQLite local " +
      "(el sistema de ficheros de las funciones es de sólo lectura).",
    CONFIG_HINT,
  );
}

// ----------------------------------------------------------------------------
// Handle del motor activo
// ----------------------------------------------------------------------------

/** Interfaz mínima que debe cumplir un motor para servir consultas. */
export interface DbHandle {
  readonly kind: DbKind;
  all(sql: string, params: SqlParam[]): Promise<Row[]>;
  one(sql: string, params: SqlParam[]): Promise<Row | null>;
  run(sql: string, params: SqlParam[]): Promise<{ changes: number; lastInsertRowid: number }>;
  runMany(stmts: { sql: string; params?: SqlParam[] }[]): Promise<number>;
  tx<T>(fn: () => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
}

// Los clientes se guardan en `unknown`: los tipos que reexporta
// `@libsql/client` son profundamente genéricos y hacen que el compilador
// reviente la pila al resolverlos.
interface GLOBALS {
  __ghSqlite?: unknown;
  __ghLibsql?: unknown;
  __ghBase?: DbHandle;
  __ghTx?: DbHandle;
  __ghSchemaReady?: boolean;
}

type SqliteDb = import("node:sqlite").DatabaseSync;

/**
 * Forma mínima del cliente de libSQL que usa GamesHunter.
 *
 * Se declara a mano en lugar de importar los tipos reales: el paquete arrastra
 * tipos profundamente genéricos que hacen que `tsc` agote la pila al resolverlos,
 * incluso con `skipLibCheck`. El límite queda en un solo sitio.
 */
interface LibsqlClient {
  execute(stmt: unknown): Promise<{ rows: unknown[]; rowsAffected: number; lastInsertRowid: number }>;
  batch(stmts: unknown[], mode?: string): Promise<{ rowsAffected: number }[]>;
  transaction(mode?: string): Promise<LibsqlTx>;
  executeMultiple(sql: string): Promise<void>;
}

interface LibsqlTx {
  execute(stmt: unknown): Promise<{ rows: unknown[]; rowsAffected: number; lastInsertRowid: number }>;
  batch(stmts: unknown[]): Promise<{ rowsAffected: number }[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

function g(): GLOBALS {
  return global as unknown as GLOBALS;
}

// ---------------------------------------------------------------------------
// Driver 1: node:sqlite (desarrollo local)
// ---------------------------------------------------------------------------

async function sqliteHandle(): Promise<DbHandle> {
  const url = resolveDbUrl();
  const file = url.startsWith("file:") ? url.slice("file:".length) : url;
  // Las rutas relativas de .env son relativas a la carpeta prisma/
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  // Import dinámico: en Vercel este módulo nunca se carga porque allí el motor
  // es Turso. Así el build no depende de que `node:sqlite` exista.
  const { DatabaseSync } = await import("node:sqlite");

  if (!g().__ghSqlite) {
    const database: SqliteDb = new DatabaseSync(abs);
    database.exec("PRAGMA journal_mode = WAL;");
    database.exec("PRAGMA foreign_keys = ON;");
    // Margen generoso: varias peticiones pueden coincidir y SQLite serializa.
    database.exec("PRAGMA busy_timeout = 10000;");
    g().__ghSqlite = database;
  }
  const db = g().__ghSqlite as SqliteDb;

  return {
    kind: "sqlite",
    async all(sql, params) {
      return (db.prepare(sql).all(...toInput(params)) as Row[]).map((r) => normalizeRow(r));
    },
    async one(sql, params) {
      const row = db.prepare(sql).get(...toInput(params)) as Row | undefined;
      return row ? normalizeRow(row) : null;
    },
    async run(sql, params) {
      const r = db.prepare(sql).run(...toInput(params));
      return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
    },
    async runMany(stmts) {
      db.exec("BEGIN");
      try {
        let count = 0;
        for (const st of stmts) {
          count += Number(db.prepare(st.sql).run(...toInput(st.params ?? [])).changes);
        }
        db.exec("COMMIT");
        return count;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    async tx(fn) {
      db.exec("BEGIN");
      try {
        const result = await fn();
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    async exec(sql) {
      db.exec(sql);
    },
  };
}

// ---------------------------------------------------------------------------
// Driver 2: Turso / libSQL sobre HTTP (Vercel)
// ---------------------------------------------------------------------------

/**
 * Carga el cliente HTTP de libSQL.
 *
 * Se usa `await import()` y no el `require` desnudo a propósito: el `require`
 * sólo existe si el bundle se emite como CommonJS (lo que hace webpack). Con
 * Turbopack o cualquier salida ESM el `require` no está definido y saltaría un
 * `ReferenceError` en cada petición. Como `@libsql/client` está en
 * `serverExternalPackages`, la importación dinámica se resuelve en runtime
 * desde `node_modules` en los dos casos.
 *
 * Además, al no ser un `import` estático, el compilador no tiene que cargar los
 * tipos profundamente genéricos del paquete (ver la nota de LibsqlClient).
 */
async function loadLibsqlHttp(): Promise<{
  createClient(cfg: { url: string; authToken?: string }): LibsqlClient;
}> {
  const specifier = "@libsql/client/http";
  const mod = (await import(/* webpackIgnore: true */ specifier)) as unknown as {
    createClient(cfg: { url: string; authToken?: string }): LibsqlClient;
  };
  if (typeof mod?.createClient !== "function") {
    throw new Error("el módulo no exporta createClient");
  }
  return mod;
}

async function libsqlHandle(): Promise<DbHandle> {
  if (!g().__ghLibsql) {
    // Se carga el cliente HTTP puro a propósito: `@libsql/client` (node)
    // arrastra el binding nativo `libsql`, que no existe en Vercel.
    let mod: { createClient(cfg: { url: string; authToken?: string }): LibsqlClient };
    try {
      mod = await loadLibsqlHttp();
    } catch (cause) {
      throw new DatabaseUnavailableError(
        "No se pudo cargar el cliente de Turso/libSQL (@libsql/client/http).",
        "Comprueba que las dependencias estén instaladas y que DATABASE_URL apunte a una " +
          `base de Turso válida. Detalle: ${describeError(cause)}`,
      );
    }
    try {
      g().__ghLibsql = mod.createClient({
        url: resolveDbUrl(),
        authToken: process.env.DATABASE_AUTH_TOKEN,
      });
    } catch (cause) {
      throw new DatabaseUnavailableError(
        `DATABASE_URL no es válida: ${describeError(cause)}`,
        CONFIG_HINT,
      );
    }
  }
  const client = g().__ghLibsql as LibsqlClient;

  const rowsOf = (rs: { rows: unknown }): Row[] =>
    (rs.rows as Row[]).map((r) => normalizeRow(r));

  return {
    kind: "libsql",
    async all(sql, params) {
      return rowsOf(await client.execute({ sql, args: toInput(params) }));
    },
    async one(sql, params) {
      return rowsOf(await client.execute({ sql, args: toInput(params) }))[0] ?? null;
    },
    async run(sql, params) {
      const rs = await client.execute({ sql, args: toInput(params) });
      return {
        changes: Number(rs.rowsAffected ?? 0),
        lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
      };
    },
    async runMany(stmts) {
      if (stmts.length === 0) return 0;
      // `batch` es atómico: se aplican todas las sentencias o ninguna.
      const results = await client.batch(
        stmts.map((st) => ({ sql: st.sql, args: toInput(st.params ?? []) })),
        "write",
      );
      return results.reduce((acc, r) => acc + Number(r.rowsAffected ?? 0), 0);
    },
    async exec(sql) {
      // executeMultiple ejecuta un script completo (varias sentencias).
      await client.executeMultiple(sql);
    },
    async tx(fn) {
      const handle = await client.transaction("write");
      const scoped: DbHandle = {
        kind: "libsql",
        async all(sql, params) {
          return rowsOf(await handle.execute({ sql, args: toInput(params) }));
        },
        async one(sql, params) {
          return rowsOf(await handle.execute({ sql, args: toInput(params) }))[0] ?? null;
        },
        async run(sql, params) {
          const rs = await handle.execute({ sql, args: toInput(params) });
          return {
            changes: Number(rs.rowsAffected ?? 0),
            lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
          };
        },
        async runMany(stmts) {
          if (stmts.length === 0) return 0;
          const results = await handle.batch(
            stmts.map((st) => ({ sql: st.sql, args: toInput(st.params ?? []) })),
          );
          return results.reduce((acc, r) => acc + Number(r.rowsAffected ?? 0), 0);
        },
        async exec() {
          throw new Error(
            "exec() multi-sentencia no está soportado dentro de una transacción remota.",
          );
        },
        async tx(inner) {
          // libSQL admite un solo nivel: se reutiliza el mismo ámbito.
          return inner();
        },
      };
      g().__ghTx = scoped;
      try {
        const result = await fn();
        await handle.commit();
        return result;
      } catch (e) {
        try {
          await handle.rollback();
        } catch {
          /* la transacción pudo cerrarse ya al caer la red */
        }
        throw e;
      } finally {
        g().__ghTx = undefined;
      }
    },
  };
}

// ----------------------------------------------------------------------------
// Arranque perezoso + auto-esquema
// ----------------------------------------------------------------------------

async function baseHandle(): Promise<DbHandle> {
  const cached = g().__ghBase;
  if (cached) return cached;
  const url = resolveDbUrl();
  if (/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      "DATABASE_URL apunta a PostgreSQL. GamesHunter despliega en Vercel con Turso (libSQL): " +
        "cambia la variable a libsql://... o consulta la sección «Migrar a PostgreSQL» del README.",
    );
  }
  // Falla rápido y con un mensaje útil si el despliegue no tiene base de datos.
  assertDbConfigured();

  let handle: DbHandle;
  try {
    handle = dbKind() === "sqlite" ? await sqliteHandle() : await libsqlHandle();
  } catch (e) {
    // `EROFS`/`EACCES`/`ENOSPC` = se intentó usar SQLite local en un entorno de
    // sólo lectura. Es un problema de configuración, no de la aplicación.
    if (/EROFS|EACCES|ENOSPC|EPERM|read-only/i.test(describeError(e))) {
      throw new DatabaseUnavailableError(
        "No se pudo abrir la base de datos local: el sistema de ficheros es de sólo lectura.",
        CONFIG_HINT,
      );
    }
    throw e;
  }
  g().__ghBase = handle;
  return handle;
}

export function readSchemaSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");
}

function describeError(e: unknown): string {
  if (e && typeof e === "object") {
    const anyE = e as { message?: string; code?: string };
    return `${anyE.code ?? ""} ${anyE.message ?? ""}`;
  }
  return String(e);
}

/**
 * Elige motor y garantiza que el esquema existe.
 *
 * El auto-esquema importa en Vercel: la primera vez que la app toca una base
 * Turso recién creada, `db:push` todavía no se ha ejecutado. Si faltan tablas,
 * se aplica `database/schema.sql` (todo `IF NOT EXISTS`: es idempotente).
 */
async function connect(): Promise<DbHandle> {
  const base = await baseHandle();
  if (g().__ghSchemaReady) return base;
  try {
    await base.all("SELECT id FROM users LIMIT 1", []);
  } catch (e) {
    const detail = describeError(e);
    if (/no such table|SQLITE_UNKNOWN|does not exist/i.test(detail)) {
      // Falta el esquema: se aplica database/schema.sql (idempotente).
      await applySchemaFile(base);
    } else if (/HTTP status 404|not found/i.test(detail)) {
      // Turso responde 404 cuando el host o la base no existen.
      throw new DatabaseUnavailableError(
        `Turso no encuentra la base de datos indicada (${detail.trim()}).`,
        `Comprueba que DATABASE_URL sea exactamente la del panel de Turso ` +
          "(`turso db show <base> --url`). Ahora mismo apunta a: " +
          `${resolveDbUrl().replace(/\/\/[^/]*@/, "//")}.`,
      );
    } else if (/SQLITE_AUTH|unauthorized|forbidden|401|403/i.test(detail)) {
      throw new DatabaseUnavailableError(
        `Turso rechazó la petición: ${detail.trim()}`,
        "DATABASE_AUTH_TOKEN no válido, caducado o sin permisos sobre la base. " +
          "Genera uno nuevo con `turso db tokens create <base>`.",
      );
    } else if (/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|network|SERVER_ERROR/i.test(detail)) {
      throw new DatabaseUnavailableError(
        `No se pudo contactar con la base de datos: ${detail.trim()}`,
        `Comprueba que DATABASE_URL (${resolveDbUrl()}) apunte a una base de Turso válida y que ` +
          "la red de la función serverless la alcance.",
      );
    } else {
      throw e;
    }
  }
  g().__ghSchemaReady = true;
  return base;
}

/** Aplica el esquema canónico, avisando si el `.sql` no viaja en la función. */
async function applySchemaFile(base: DbHandle): Promise<void> {
  let sql: string;
  try {
    sql = readSchemaSql();
  } catch (cause) {
    throw new DatabaseUnavailableError(
      `La base de datos no tiene tablas y no se encontró database/schema.sql: ${describeError(cause)}`,
      "El fichero debe incluirse en el paquete de la función. En next.config.mjs está " +
        'configurado outputFileTracingIncludes: { "/*": ["./database/**/*.sql"] }.',
    );
  }
  await base.exec(sql);
}

/** Motor a usar: el de la transacción si estamos dentro de `tx`, si no el base. */
async function active(): Promise<DbHandle> {
  const tx = g().__ghTx;
  if (tx) return tx;
  return connect();
}

// ----------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------

/** Devuelve todas las filas. */
export async function all<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  return (await active()).all(sql, params) as unknown as T[];
}

/** Devuelve la primera fila o null. */
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T | null> {
  return (await active()).one(sql, params) as T | null;
}

/** Ejecuta una escritura. Devuelve changes y lastInsertRowid. */
export async function run(
  sql: string,
  params: SqlParam[] = [],
): Promise<{ changes: number; lastInsertRowid: number }> {
  return (await active()).run(sql, params);
}

/** Ejecuta varias escrituras en una transacción atómica. */
export async function runMany(statements: { sql: string; params?: SqlParam[] }[]): Promise<number> {
  return (await active()).runMany(statements);
}

/** Agrupa condicionales en una transacción. */
export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  return (await connect()).tx(fn);
}

/** Ejecuta un script con varias sentencias (no usar dentro de `tx`). */
export async function exec(sql: string): Promise<void> {
  await (await connect()).exec(sql);
}

/** Aplica database/schema.sql (idempotente: usa IF NOT EXISTS). */
export async function applySchema(): Promise<void> {
  const handle = await baseHandle();
  await applySchemaFile(handle);
  g().__ghSchemaReady = true;
}

/** Conexión ya resuelta, para scripts (seed, db:push). */
export async function getDb(): Promise<DbHandle> {
  return connect();
}

/** Ejecuta una sentencia y devuelve el id insertado. */
export async function insert(sql: string, params: SqlParam[] = []): Promise<string> {
  const { lastInsertRowid } = await run(sql, params);
  return String(lastInsertRowid);
}

// ----------------------------------------------------------------------------
// Helpers de construcción de consultas (sin efectos)
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