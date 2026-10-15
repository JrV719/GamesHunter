"use client";

import { useSearchParams } from "next/navigation";
import { IconShield } from "@/components/ui/Icon";

const MESSAGES: Record<string, string> = {
  "sin-permisos":
    "Tu cuenta no tiene permisos para esa zona. El panel de administración es sólo para administradores y moderadores.",
};

/**
 * Aviso cuando `requireStaff()` o `requireAdmin()` rechazan el acceso y
 * mandan a la portada con `?error=...`.
 *
 * Se lee la query en el cliente a propósito: si la portada leyera
 * `searchParams` en el servidor, dejaría de prerenderizarse. Al ir dentro de
 * un `<Suspense>`, la portada sigue estática y sólo este banner se hidrata.
 */
export function AccessNotice() {
  const params = useSearchParams();
  const message = params.get("error") ? MESSAGES[params.get("error") ?? ""] : undefined;
  if (!message) return null;

  return (
    <div className="gh-container pt-6">
      <p
        role="alert"
        className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-200"
      >
        <IconShield size={16} className="shrink-0" />
        {message}
      </p>
    </div>
  );
}