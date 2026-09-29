"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatScore } from "@/lib/utils";
import { IconSearch, IconX, IconAlert, IconGlobe } from "@/components/ui/Icon";
import { GameCover } from "@/components/ui/GameCover";
import { difficultyTextColor } from "@/components/ui/primitives";

export type Suggestion = {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  accentColor: string;
  releaseDateText: string | null;
  developer: { name: string };
  platforms: { slug: string; shortName: string }[];
  difficulties: { score: number }[];
};

/**
 * Buscador principal.
 * - Búsqueda mientras se escribe vía /api/search (con debounce y AbortController).
 * - Navegación por teclado (↑ ↓ Enter Esc).
 */
export function SearchBar({
  initialQuery = "",
  size = "lg",
  autoFocus = false,
  placeholder = "Busca un juego...",
  className,
}: {
  initialQuery?: string;
  size?: "lg" | "md" | "sm";
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sizes = {
    lg: "h-14 text-base pl-12 pr-11 sm:h-16 sm:text-lg",
    md: "h-11 text-sm pl-10 pr-9",
    sm: "h-9 text-sm pl-9 pr-8",
  } as const;
  const iconSizes = { lg: 20, md: 17, sm: 15 } as const;

  // Debounce + cancelación de la petición anterior
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { results: Suggestion[] };
        setResults(data.results);
        setHighlight(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Cierra el desplegable al pulsar fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const submit = useCallback(
    (value: string) => {
      const q = value.trim();
      setOpen(false);
      inputRef.current?.blur();
      router.push(q ? `/juegos?q=${encodeURIComponent(q)}` : "/juegos");
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (results.length ? (h + 1) % results.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (results.length ? (h - 1 + results.length) % results.length : -1));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && results[highlight]) {
        e.preventDefault();
        setOpen(false);
        router.push(`/juegos/${results[highlight].slug}`);
      } else {
        submit(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="relative"
      >
        <IconSearch
          size={iconSizes[size]}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base-400"
        />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-label="Buscar videojuego"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          role="combobox"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-2xl border border-base-700 bg-base-850 text-base-100 shadow-lg outline-none transition-all",
            "placeholder:text-base-400 focus:border-accent-500 focus:bg-base-800 focus:shadow-glow",
            sizes[size],
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-base-400 transition-colors hover:bg-base-700 hover:text-base-100"
          >
            <IconX size={16} />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-base-700 bg-base-850/98 shadow-2xl backdrop-blur-xl"
        >
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-base-400">Buscando…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-base-400">
              Sin resultados para «{query}». Pulsa Enter para ver todos los juegos.
            </div>
          )}
          <ul className="max-h-[70vh] overflow-y-auto">
            {results.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={`/juegos/${r.slug}`}
                  role="option"
                  aria-selected={i === highlight}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors",
                    i === highlight ? "bg-accent-600/15" : "hover:bg-base-800",
                  )}
                >
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md">
                    <GameCover
                      src={r.coverImage}
                      alt=""
                      slug={r.slug}
                      title={r.title}
                      accentColor={r.accentColor}
                      className="h-full w-full"
                      sizes="36px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-base-100">{r.title}</p>
                    <p className="truncate text-[11px] text-base-400">
                      {r.developer.name} · {r.platforms.map((p) => p.shortName).join(" / ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {r.difficulties[0] && (
                      <span
                        className={cn(
                          "font-mono text-xs font-bold tabular-nums",
                          difficultyTextColor(r.difficulties[0].score),
                        )}
                      >
                        {formatScore(r.difficulties[0].score)}
                      </span>
                    )}
                    <IconAlert size={12} className="text-base-600" />
                    <IconGlobe size={12} className="text-base-600" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => submit(query)}
              className="w-full border-t border-base-700 bg-base-800/60 px-4 py-2.5 text-left text-xs font-semibold text-accent-300 transition-colors hover:bg-base-750"
            >
              Ver todos los resultados para «{query}» →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
