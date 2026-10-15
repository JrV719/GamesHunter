"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconSearch, IconX } from "@/components/ui/Icon";

export type GameOption = { id: string; title: string; slug: string; subtitle?: string | null };

/**
 * Selector de juego con búsqueda incremental.
 *
 * Guarda el `id` del juego elegido en un input oculto. Si el usuario no elige
 * nada se envía una cadena vacía y la publicación queda sin juego asociado,
 * que es un caso válido: el foro admite temas que no hablan de un juego.
 */
export function GamePicker({
  name,
  games,
  initial,
}: {
  name: string;
  games: GameOption[];
  initial?: GameOption | null;
}) {
  const [selected, setSelected] = useState<GameOption | null>(initial ?? null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const needle = query.trim().toLowerCase();
  const options = (needle
    ? games.filter(
        (g) => g.title.toLowerCase().includes(needle) || g.slug.toLowerCase().includes(needle),
      )
    : games
  ).slice(0, 8);

  if (selected) {
    return (
      <div className="flex items-center gap-2" ref={boxRef}>
        <input type="hidden" name={name} value={selected.id} />
        <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-accent-300">
          {selected.title}
        </span>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-base-400 transition-colors hover:bg-base-750 hover:text-base-100"
        >
          <IconX size={12} /> Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <input type="hidden" name={name} value="" />
      <IconSearch
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-400"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar un juego (opcional)..."
        className="gh-input pl-9"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-label="Buscar un juego"
      />

      {open && options.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-base-700 bg-base-800 p-1 shadow-xl">
          {options.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(g);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-base-750",
                )}
              >
                <span className="block truncate text-[13px] font-semibold text-base-100">
                  {g.title}
                </span>
                {g.subtitle && (
                  <span className="block truncate text-[11px] text-base-500">{g.subtitle}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && needle && options.length === 0 && (
        <p className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-base-700 bg-base-800 px-3 py-2.5 text-[12px] text-base-500 shadow-xl">
          Ningún juego coincide con «{query}».
        </p>
      )}
    </div>
  );
}