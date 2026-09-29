"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { USER_GAME_STATUSES, USER_GAME_STATUS_LABELS, type UserGameStatus } from "@/lib/constants";
import { IconBookmark, IconPlay, IconCheck, IconTrophy, IconList } from "@/components/ui/Icon";

/**
 * Acciones de usuario sobre un juego (favorito, estado, platino).
 * Requiere sesión; si no hay sesión, redirige al login.
 */
export function GameUserActions({
  gameId,
  isLoggedIn,
  initial,
}: {
  gameId: string;
  isLoggedIn: boolean;
  initial?: { favorite: boolean; status: string | null };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
  const [status, setStatus] = useState<string | null>(initial?.status ?? null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(action: string, extra: Record<string, string> = {}) {
    if (!isLoggedIn) {
      router.push(`/login?siguiente=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setMessage(null);
    const res = await fetch("/api/user/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, action, ...extra }),
    });
    if (!res.ok) {
      setMessage("No se pudo guardar el cambio.");
      return;
    }
    const data = (await res.json()) as { ok: boolean; value?: boolean | string; error?: string };
    if (data.error) {
      setMessage(data.error);
      return;
    }
    if (action === "favorite") setFavorite(Boolean(data.value));
    if (action === "status") setStatus(String(data.value));
    setMessage("Guardado.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="gh-card p-4">
      <p className="gh-label flex items-center gap-1.5">
        <IconList size={12} /> Mi biblioteca
      </p>

      <div className="mt-2 space-y-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => post("favorite")}
          className={cn(
            "gh-btn w-full text-xs",
            favorite ? "gh-btn-primary" : "gh-btn-ghost",
          )}
        >
          <IconBookmark size={14} />
          {favorite ? "En favoritos" : "Añadir a favoritos"}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {(["backlog", "playing"] as UserGameStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => post("status", { status: s })}
              className={cn(
                "gh-btn text-xs",
                status === s ? "gh-btn-primary" : "gh-btn-ghost",
              )}
            >
              {s === "playing" ? <IconPlay size={13} /> : <IconList size={13} />}
              {USER_GAME_STATUS_LABELS[s]}
            </button>
          ))}
          <button
            type="button"
            disabled={isPending}
            onClick={() => post("status", { status: "completed" })}
            className={cn(
              "gh-btn col-span-2 text-xs",
              status === "completed" ? "gh-btn-primary" : "gh-btn-ghost",
            )}
          >
            <IconCheck size={13} /> Marcar como completado
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => post("platinum")}
            className="gh-btn gh-btn-ghost col-span-2 text-xs"
          >
            <IconTrophy size={13} /> Registrar platino
          </button>
        </div>
      </div>

      {message && <p className="mt-2 text-[11px] text-accent-300">{message}</p>}

      {!isLoggedIn && (
        <p className="mt-3 border-t border-base-700 pt-2.5 text-[11px] leading-relaxed text-base-500">
          Crea una cuenta para guardar favoritos, marcar juegos como jugando o completados y
          registrar tus platinos.
        </p>
      )}
    </div>
  );
}

export { USER_GAME_STATUSES };
