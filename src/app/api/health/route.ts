import { NextResponse } from "next/server";
import {
  all,
  dbKind,
  dbDescription,
  usesLocalFile,
  databaseUrl,
  databaseToken,
  DatabaseUnavailableError,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; required: boolean; detail: string };

/** Nombres que el código sabe leer. Sólo se publica si están definidos, no su valor. */
const KNOWN_DB_VARS = [
  "DATABASE_URL",
  "DATABASE_AUTH_TOKEN",
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "LIBSQL_URL",
  "LIBSQL_AUTH_TOKEN",
  "LIBSQL_DATABASE_URL",
  "TURSO_DB_TOKEN",
] as const;

/**
 * Sonda de diagnóstico del despliegue.
 *
 * Sirve para comprobar, desde el navegador o con `curl`, si la aplicación
 * encuentra la base de datos en producción. Devuelve únicamente si cada
 * variable está presente (nunca su valor) para no filtrar credenciales.
 *
 * Responde 200 si todo lo obligatorio está bien y 503 si falta algo, de modo que
 * se pueda usar como comprobación automática del despliegue.
 */
export async function GET() {
  const checks: Check[] = [];

  const present = KNOWN_DB_VARS.filter((name) => Boolean(process.env[name]?.trim()));
  const url = databaseUrl();
  const token = databaseToken();
  const serverless = Boolean(process.env.VERCEL);
  const remote = !usesLocalFile();

  // En Vercel, `DATABASE_URL=file:...` está definida pero no sirve: el sistema
  // de ficheros es de sólo lectura. Se considera inválida, no "presente".
  const urlUsable = Boolean(url.value) && !(serverless && !remote);

  checks.push({
    name: "Conexión",
    ok: urlUsable,
    required: true,
    detail: !url.value
      ? "Ninguna variable de conexión definida. Se buscará, por orden: " +
        "DATABASE_URL, TURSO_DATABASE_URL, LIBSQL_URL, LIBSQL_DATABASE_URL."
      : serverless && !remote
        ? `${url.name} apunta a un fichero local (file:), que Vercel no puede abrir. Debe ser libsql://...`
        : `Usando ${url.name}.`,
  });

  // Informativo, no bloqueante: hay bases libsql sin token (sqld propio) y la
  // prueba de conexión de más abajo es la que decide de verdad.
  checks.push({
    name: "Token",
    ok: !remote || Boolean(token.value),
    required: false,
    detail: remote
      ? token.value
        ? `Usando ${token.name}.`
        : "Sin definir: Turso rechazará las peticiones (salvo sqld sin auth)."
      : serverless
        ? "No se usa con SQLite local; hará falta al pasar a una base libsql://."
        : "No necesaria: la base actual es un fichero SQLite local.",
  });

  // Esta comprobación es la que resuelve el diagnóstico remoto: dice qué
  // nombres existen realmente en el entorno, sin revelar ningún valor.
  checks.push({
    name: "Variables de BD detectadas",
    ok: present.length > 0,
    required: false,
    detail: present.length ? present.join(", ") : "Ninguna.",
  });

  checks.push({
    name: "SESSION_SECRET",
    ok: (process.env.SESSION_SECRET?.length ?? 0) >= 16,
    required: true,
    detail:
      (process.env.SESSION_SECRET?.length ?? 0) >= 16
        ? "Definida."
        : "Sin definir o más corta de 16 caracteres: el login y el registro fallarán.",
  });

  checks.push({
    name: "NEXT_PUBLIC_SITE_URL",
    ok: true,
    required: false,
    detail: process.env.NEXT_PUBLIC_SITE_URL?.trim()
      ? "Definida."
      : "Sin definir: se usará el dominio que Vercel inyecta en el despliegue.",
  });

  // Prueba real de conexión.
  let dbOk = false;
  let dbDetail = "";
  try {
    const rows = await all<{ n: number }>("SELECT COUNT(*) AS n FROM games");
    dbOk = true;
    dbDetail = `Conectado. ${rows[0]?.n ?? 0} juegos en el catálogo.`;
  } catch (e) {
    dbDetail =
      e instanceof DatabaseUnavailableError
        ? `${e.message}\n${e.hint}`
        : (e as Error).message;
  }

  checks.push({ name: "Base de datos", ok: dbOk, required: true, detail: dbDetail });

  const failing = checks.filter((c) => c.required && !c.ok);
  const ok = failing.length === 0;

  return NextResponse.json(
    {
      ok,
      status: ok ? "ok" : "error",
      runtime: dbDescription(),
      motor: dbKind(),
      serverless,
      // Nombres, nunca valores.
      conexionDesde: url.name,
      tokenDesde: token.name,
      variablesPresentes: present,
      siteUrl: (await import("@/lib/site-url")).siteUrl(),
      checks,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
