"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, formatScore } from "@/lib/utils";
import { GameCover } from "@/components/ui/GameCover";
import { difficultyTextColor } from "@/components/ui/primitives";
import { IconSearch, IconX, IconScale, IconPlus } from "@/components/ui/Icon";
import type { Category, Platform } from "@/lib/db-types";

type Suggest = {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  accentColor: string;
  developer: { name: string };
  platforms: { slug: string; shortName: string }[];
  difficulties: { score: number }[];
};

const MAX = 4;

/** Selector de juegos para el comparador (máx. 4). */
export function CompareBuilder({
  platforms,
  categories,
  selected,
}: {
  platforms: Platform[];
  categories: Category[];
  selected: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggest[]>([]);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>(selected);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setChosen(selected), [selected]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`);
      if (res.ok) setResults(((await res.json()) as { results: Suggest[] }).results);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function apply(slugs: string[]) {
    setChosen(slugs);
    setQuery("");
    setOpen(false);
    const p = new URLSearchParams(params.toString());
    if (slugs.length) p.set("juegos", slugs.join(","));
    else p.delete("juegos");
    router.push(`${pathname}?${p.toString()}`);
  }

  function add(slug: string) {
    if (chosen.includes(slug)) return;
    if (chosen.length >= MAX) return;
    apply([...chosen, slug]);
  }

  function remove(slug: string) {
    apply(chosen.filter((s) => s !== slug));
  }

  const quickLinks = [
    { label: "Platino fácil vs difícil", slugs: ["the-last-of-us-part-i", "cyberpunk-2077"] },
    { label: "PS4 vs PS5", slugs: ["god-of-war", "ratchet-clank-rift-apart"] },
    {
      label: "Soulslike",
      slugs: ["bloodborne", "demons-souls"],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="gh-card p-4">
        {/* Seleccionados */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <IconScale size={16} className="text-accent-400" />
          <span className="text-sm font-semibold text-base-200">
            Juegos a comparar ({chosen.length}/{MAX})
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: MAX }).map((_, i) => {
            const slug = chosen[i];
            return slug ? (
              <div
                key={slug}
                className="flex items-center gap-2.5 rounded-lg border border-accent-500/30 bg-accent-600/10 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-base-100">{slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(slug)}
                  aria-label={`Quitar ${slug}`}
                  className="rounded p-1 text-base-400 hover:bg-base-700 hover:text-rose-300"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-base-600 p-2 text-[11px] text-base-500"
              >
                <IconPlus size={12} />_slot {i + 1}
              </div>
            );
          })}
        </div>

        {/* Buscador */}
        <div ref={boxRef} className="relative mt-3">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-400"
          />
          <input
            type="search"
            value={query}
            disabled={chosen.length >= MAX}
            placeholder={
              chosen.length >= MAX
                ? "Máximo 4 juegos. Quita uno para añadir otro."
                : "Añade un juego al comparador..."
            }
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="gh-input pl-9"
          />
          {open && query.trim().length >= 2 && (
            <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 max-h-72 overflow-y-auto rounded-xl border border-base-700 bg-base-850/98 shadow-2xl backdrop-blur-xl">
              {results.length === 0 ? (
                <p className="px-3 py-3 text-xs text-base-400">Sin resultados.</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={chosen.includes(r.slug)}
                    onClick={() => add(r.slug)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-base-800",
                      chosen.includes(r.slug) && "opacity-40",
                    )}
                  >
                    <div className="h-9 w-7 shrink-0 overflow-hidden rounded">
                      <GameCover
                        src={r.coverImage}
                        alt=""
                        slug={r.slug}
                        title={r.title}
                        accentColor={r.accentColor}
                        className="h-full w-full"
                        sizes="28px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-base-100">{r.title}</p>
                      <p className="truncate text-[11px] text-base-400">
                        {r.developer.name} ·{" "}
                        {r.platforms.map((p) => p.shortName).join(" / ")}
                      </p>
                    </div>
                    {r.difficulties[0] && (
                      <span
                        className={cn(
                          "font-mono text-[11px] font-bold",
                          difficultyTextColor(r.difficulties[0].score),
                        )}
                      >
                        {formatScore(r.difficulties[0].score)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Filtros rápidos de plataforma / género */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <a
              key={p.id}
              href={`/juegos?plataforma=${p.slug}`}
              className="gh-chip border-base-700 bg-base-850 text-base-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
            >
              {p.shortName}
            </a>
          ))}
          {categories
            .filter((c) => (c.gameCount ?? 0) > 0)
            .slice(0, 8)
            .map((c) => (
              <a
                key={c.id}
                href={`/juegos?genero=${c.slug}`}
                className="gh-chip border-base-700 bg-base-850 text-base-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
                title={`${c.gameCount ?? 0} juegos en el catálogo`}
              >
                {c.name}
              </a>
            ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-base-700 pt-3">
          <span className="text-[11px] text-base-500">Comparaciones de ejemplo:</span>
          {quickLinks.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => apply(q.slugs)}
              className="text-[11px] font-semibold text-accent-300 hover:underline"
            >
              {q.label}
            </button>
          ))}
          {chosen.length > 0 && (
            <button
              type="button"
              onClick={() => apply([])}
              className="ml-auto text-[11px] text-base-400 hover:text-rose-300"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
