import { NextResponse } from "next/server";
import { all, dbKind, dbDescription, usesLocalFile, DatabaseUnavailableError } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; required: boolean; detail: string };

/**
 * Sonda de diagnóstico del despliegue.
 *
 * Sirve para comprobar, desde el panel de Vercel o el navegador, si la
 * aplicación encuentra la base de datos en producción. Devuelve únicamente si
 * cada variable está presente (nunca su valor) para no filtrar credenciales.
 *
 * Responde 200 si todo lo obligatorio está bien y 503 si falta algo, de modo que
 * se pueda usar como comprobación automática del despliegue.
 */
export async function GET() {
  const checks: Check[] = [];

  const env = (name: string) => Boolean(process.env[name]?.trim());
  const remote = !usesLocalFile();
  const serverless = Boolean(process.env.VERCEL);
  // En Vercel, `DATABASE_URL=file:...` está definida pero no sirve: el sistema
  // de ficheros es de sólo lectura. Se considera inválida, no "presente".
  const urlUsable = env("DATABASE_URL") && !(serverless && !remote);

  checks.push({
    name: "DATABASE_URL",
    ok: urlUsable,
    required: true,
    detail: !env("DATABASE_URL")
      ? serverless
        ? "Sin definir: se usaría la base SQLite local y Vercel no tiene disco. Causa del error 500."
        : "Sin definir: se usa la base SQLite local de desarrollo."
      : serverless && !remote
        ? "Apunta a un fichero local (file:), que Vercel no puede abrir. Debe ser libsql://..."
        : `Configurada (${process.env.DATABASE_URL!.split(":")[0]}:).`,
  });

  // Informativo, no bloqueante: hay bases libsql sin token (sqld propio) y la
  // prueba de conexión de más abajo es la que decide de verdad. Marcarlo como
  // obligatorio daría falsos negativos.
  checks.push({
    name: "DATABASE_AUTH_TOKEN",
    ok: !remote || env("DATABASE_AUTH_TOKEN"),
    required: false,
    detail: remote
      ? env("DATABASE_AUTH_TOKEN")
        ? "Definida."
        : "Sin definir: Turso rechazará las peticiones (salvo sqld sin auth)."
      : serverless
        ? "No se usa con SQLite local; hará falta al pasar a una base libsql://."
        : "No necesaria: la base actual es un fichero SQLite local.",
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
    detail: env("NEXT_PUBLIC_SITE_URL")
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
      siteUrl: (await import("@/lib/site-url")).siteUrl(),
      checks,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
