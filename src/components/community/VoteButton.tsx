"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { IconFlag, IconHeart } from "@/components/ui/Icon";
import { REPORT_REASONS, REPORT_REASON_LABELS } from "@/lib/constants";

/**
 * Botón «me gusta». Requiere sesión: sin ella redirige al login.
 * Cuando no hay servidor (visitante) no hace falta bloquear nada, la API
 * responde 401 y se ofrece el acceso.
 */
export function VoteButton({
  targetType,
  targetId,
  count,
  voted,
  isLoggedIn,
  loginHref,
}: {
  targetType: "post" | "comment";
  targetId: string;
  count: number;
  voted: boolean;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const router = useRouter();
  const [state, setState] = useState({ count, voted });
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    // Actualización optimista: se revierte si la API falla.
    const optimistic = { count: state.voted ? state.count - 1 : state.count + 1, voted: !state.voted };
    setState(optimistic);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setState({ count, voted });
        if (res.status === 401) router.push(loginHref);
        return;
      }
      setState({ count: data.value, voted: data.active });
    } catch {
      setState({ count, voted });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.voted}
      title={state.voted ? "Quitar me gusta" : "Me gusta"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors",
        state.voted
          ? "bg-rose-500/10 text-rose-300"
          : "text-base-500 hover:bg-base-750 hover:text-base-300",
        pending && "opacity-60",
      )}
    >
      <IconHeart size={13} className={state.voted ? "fill-current" : ""} />
      <span className="font-mono tabular-nums">{state.count}</span>
      <span className="sr-only">Me gusta</span>
    </button>
  );
}

/** Denunciar contenido. Abre el desplegable de motivos. */
export function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
  loginHref,
}: {
  targetType: "post" | "comment";
  targetId: string;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(reason: string) {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      if (res.ok) {
        setSent(true);
        setOpen(false);
      } else if (res.status === 401) {
        router.push(loginHref);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <span className="text-[11px] text-emerald-400">Denunciado. Gracias.</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-base-500 transition-colors hover:bg-base-750 hover:text-amber-300"
        title="Denunciar"
      >
        <IconFlag size={13} />
        <span className="sr-only">Denunciar</span>
      </button>

      {open && (
        <>
          {/* Clic fuera para cerrar */}
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 bottom-full z-20 mb-1 w-48 rounded-xl border border-base-700 bg-base-800 p-1.5 shadow-xl">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-base-500">
              Motivo
            </p>
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                disabled={busy}
                onClick={() => send(r)}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-base-200 transition-colors hover:bg-base-750 disabled:opacity-50"
              >
                {REPORT_REASON_LABELS[r]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}