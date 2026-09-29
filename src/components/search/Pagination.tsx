"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { GameFilters, GameSort } from "@/lib/filters";

const ALL_PARAM_KEYS: (keyof GameFilters)[] = [
  "q",
  "platforms",
  "categories",
  "minDifficulty",
  "maxDifficulty",
  "minHours",
  "maxHours",
  "minTrophies",
  "maxTrophies",
  "online",
  "missables",
  "recommended",
  "developer",
  "releaseYear",
];

const PARAM_FOR: Partial<Record<keyof GameFilters, string>> = {
  q: "q",
  platforms: "plataforma",
  categories: "genero",
  minDifficulty: "difMin",
  maxDifficulty: "difMax",
  minHours: "horasMin",
  maxHours: "horas",
  minTrophies: "trofeosMin",
  maxTrophies: "trofeosMax",
  online: "online",
  missables: "perdibles",
  recommended: "recomendado",
  developer: "developer",
  releaseYear: "anio",
};

/** Reconstruye la URL de la página N conservando todos los filtros activos. */
function href(page: number, sort: GameSort, filters: GameFilters, base: string) {
  const p = new URLSearchParams();
  for (const key of ALL_PARAM_KEYS) {
    const value = filters[key];
    const param = PARAM_FOR[key];
    if (!param || value === undefined || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) p.set(param, value.join(","));
    } else {
      p.set(param, String(value));
    }
  }
  if (sort && sort !== "relevance") p.set("orden", sort);
  if (page > 1) p.set("pagina", String(page));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Paginación accesible con ventana de páginas. */
export function Pagination({
  page,
  totalPages,
  total,
  sort,
  filters,
  base = "/juegos",
  pageSize = 24,
}: {
  page: number;
  totalPages: number;
  total: number;
  sort: GameSort;
  filters: GameFilters;
  base?: string;
  pageSize?: number;
}) {
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  const pages: (number | "gap")[] = [];
  const push = (n: number) => pages.push(n);
  push(1);
  if (page > 3) pages.push("gap");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
  if (page < totalPages - 2) pages.push("gap");
  if (totalPages > 1) push(totalPages);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Paginación de resultados"
      className="mt-8 flex flex-col items-center gap-3 border-t border-base-700/70 pt-6 sm:flex-row sm:justify-between"
    >
      <p className="text-xs text-base-500">
        Mostrando <span className="font-mono text-base-300">{from}</span>–
        <span className="font-mono text-base-300">{to}</span> de{" "}
        <span className="font-mono text-base-300">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageLink
          href={href(page - 1, sort, filters, base)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <IconChevronLeft size={15} />
        </PageLink>

        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1.5 text-xs text-base-600">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p, sort, filters, base)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg font-mono text-xs font-semibold transition-colors",
                p === page
                  ? "bg-accent-600 text-white"
                  : "text-base-400 hover:bg-base-800 hover:text-base-100",
              )}
            >
              {p}
            </Link>
          ),
        )}

        <PageLink
          href={href(page + 1, sort, filters, base)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <IconChevronRight size={15} />
        </PageLink>
      </div>
      <span className="sr-only">{params.toString()}</span>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg text-base-600"
        {...rest}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid h-8 w-8 place-items-center rounded-lg text-base-400 transition-colors hover:bg-base-800 hover:text-base-100"
      {...rest}
    >
      {children}
    </Link>
  );
}
