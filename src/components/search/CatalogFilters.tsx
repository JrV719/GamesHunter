"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { SORT_LABELS, SORTS, FILTER_PARAM_LABELS, type GameFilters, type GameSort } from "@/lib/filters";
import type { Category, Developer, Platform } from "@/lib/db-types";
import { IconFilter, IconX, IconChevronDown, IconSort } from "@/components/ui/Icon";

type Props = {
  platforms: Platform[];
  categories: Category[];
  developers: Developer[];
  filters: GameFilters;
};

/** Construye la URL del catálogo a partir de los filtros actuales. */
/**
 * Construye la URL completa del catálogo a partir de los parámetros actuales.
 * Devuelve siempre una ruta absoluta desde "/juegos" (nunca solo el query).
 */
function buildHref(
  current: URLSearchParams,
  patch: Record<string, string | number | boolean | string[] | null | undefined>,
  base = "/juegos",
) {
  const p = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
      p.delete(k);
    } else {
      p.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  }
  p.delete("pagina");
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-base-700/70 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-3 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-base-300">{title}</span>
        <IconChevronDown
          size={14}
          className={cn("text-base-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="pb-3.5">{children}</div>}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px] text-base-300 transition-colors hover:text-base-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-base-600 bg-base-850 checked:border-accent-500 checked:bg-accent-500 focus-visible:outline-2 focus-visible:outline-accent-400"
        style={
          checked
            ? {
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%230b0f14' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 8.5 3.5 3.5L13 5'/%3E%3C/svg%3E\")",
                backgroundSize: "100%",
              }
            : undefined
        }
      />
      <span className="flex-1">{label}</span>
      {count != null && <span className="font-mono text-[10px] text-base-500">{count}</span>}
    </label>
  );
}

function RangeField({
  label,
  value,
  onChange,
  suffix,
  max = 200,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  max?: number;
}) {
  return (
    <div>
      <label className="gh-label">{label}</label>
      <input
        type="range"
        min={0}
        max={max}
        step={5}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value) === 0 ? undefined : Number(e.target.value))}
        className="w-full accent-[var(--color-accent-500)]"
      />
      <p className="mt-0.5 text-right font-mono text-[11px] text-base-400">
        {value == null ? "Sin límite" : `${value}${suffix ?? ""}`}
      </p>
    </div>
  );
}

export function CatalogFilters({ platforms, categories, developers, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const update = useCallback(
    (patch: Record<string, string | number | boolean | string[] | null | undefined>) => {
      router.push(buildHref(new URLSearchParams(params.toString()), patch));
    },
    [router, params],
  );

  const toggleIn = (key: string, current: string[] | undefined, value: string) => {
    const set = new Set(current ?? []);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    update({ [key]: Array.from(set) });
  };

  const activeCount = Object.entries(filters).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== false,
  ).length;

  return (
    <>
      {/* Botón móvil */}
      <button
        type="button"
        onClick={() => setOpenMobile((v) => !v)}
        aria-expanded={openMobile}
        className="gh-btn gh-btn-ghost w-full justify-between lg:hidden"
      >
        <span className="flex items-center gap-2">
          <IconFilter size={15} /> Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <IconChevronDown size={15} className={cn("transition-transform", openMobile && "rotate-180")} />
      </button>

      <div
        className={cn(
          "gh-card mt-3 px-4 lg:mt-0 lg:block lg:max-h-none lg:overflow-visible",
          openMobile ? "block" : "hidden",
        )}
      >
        {activeCount > 0 && (
          <div className="flex items-center justify-between border-b border-base-700/70 py-3">
            <span className="text-xs font-semibold text-accent-300">
              {activeCount} filtro{activeCount > 1 ? "s" : ""} activo{activeCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => router.push("/juegos")}
              className="flex items-center gap-1 text-[11px] text-base-400 hover:text-rose-300"
            >
              <IconX size={12} /> Limpiar
            </button>
          </div>
        )}

        <Group title="Plataforma">
          {platforms.map((p) => (
            <Check
              key={p.id}
              label={p.name}
              checked={filters.platforms?.includes(p.slug) ?? false}
              onChange={() => toggleIn("plataforma", filters.platforms, p.slug)}
            />
          ))}
        </Group>

        <Group title="Género">
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {categories.map((c) => (
              <Check
                key={c.id}
                label={c.name}
                count={c.gameCount}
                checked={filters.categories?.includes(c.slug) ?? false}
                onChange={() => toggleIn("genero", filters.categories, c.slug)}
              />
            ))}
          </div>
        </Group>

        <Group title="Dificultad del Platino">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Fácil", min: undefined, max: 4, hint: "1-4" },
              { label: "Media", min: 5, max: 6, hint: "5-6" },
              { label: "Difícil", min: 7, max: undefined, hint: "7-10" },
            ].map((r) => {
              const active = filters.minDifficulty === r.min && filters.maxDifficulty === r.max;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() =>
                    update(
                      active
                        ? { difMin: null, difMax: null }
                        : { difMin: r.min ?? null, difMax: r.max ?? null },
                    )
                  }
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-accent-500/50 bg-accent-600/20 text-accent-300"
                      : "border-base-700 bg-base-850 text-base-400 hover:border-base-600",
                  )}
                >
                  {r.label}
                  <span className="block text-[9px] font-normal opacity-70">{r.hint}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-base-500">
            Mide el esfuerzo de la lista de trofeos, no la dificultad del juego.
          </p>
        </Group>

        <Group title="Tiempo del Platino">
          <RangeField
            label="Menos de (horas)"
            value={filters.maxHours}
            onChange={(v) => update({ horas: v })}
            max={120}
          />
          <div className="mt-2 space-y-0.5">
            {[
              { label: "Menos de 10 horas", v: 10 },
              { label: "Menos de 20 horas", v: 20 },
              { label: "Más de 50 horas", v: 50, min: true },
            ].map((o) => {
              const active = o.min
                ? filters.minHours === o.v
                : filters.maxHours === o.v;
              return (
                <Check
                  key={o.label}
                  label={o.label}
                  checked={active}
                  onChange={() =>
                    update(
                      o.min
                        ? active
                          ? { horasMin: null }
                          : { horasMin: o.v, horas: null }
                        : active
                          ? { horas: null }
                          : { horas: o.v, horasMin: null },
                    )
                  }
                />
              );
            })}
          </div>
        </Group>

        <Group title="Trofeos" defaultOpen={false}>
          <RangeField
            label="Mínimo de trofeos"
            value={filters.minTrophies}
            onChange={(v) => update({ trofeosMin: v })}
            max={100}
          />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["oro", "Oro", filters.minGold],
                ["plata", "Plata", filters.minSilver],
                ["bronce", "Bronce", filters.minBronze],
              ] as const
            ).map(([key, label, value]) => (
              <div key={key}>
                <label className="gh-label">{label} mín.</label>
                <input
                  type="number"
                  min={0}
                  value={value ?? ""}
                  onChange={(e) =>
                    update({ [key]: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="gh-input py-1 text-center font-mono text-xs"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
        </Group>

        <Group title="Tipo de platino">
          <Check
            label="Con trofeos online"
            checked={filters.online ?? false}
            onChange={(v) => update({ online: v ? "1" : null })}
          />
          <Check
            label="Con trofeos perdibles"
            checked={filters.missables ?? false}
            onChange={(v) => update({ perdibles: v ? "1" : null })}
          />
          <Check
            label="Múltiples partidas"
            checked={filters.multiplePlaythroughs ?? false}
            onChange={(v) => update({ partidas: v ? "1" : null })}
          />
          <Check
            label="Grindeo alto"
            checked={filters.grind ?? false}
            onChange={(v) => update({ grindeo: v ? "1" : null })}
          />
          <Check
            label="Con coleccionables"
            checked={filters.collectibles ?? false}
            onChange={(v) => update({ coleccionables: v ? "1" : null })}
          />
          <Check
            label="Trofeos atados a la dificultad"
            checked={filters.difficultyLinked ?? false}
            onChange={(v) => update({ dificultadVinculada: v ? "1" : null })}
          />
          <Check
            label="Requiere máxima dificultad"
            checked={filters.requiresMaxDifficulty ?? false}
            onChange={(v) => update({ maxDificultad: v ? "1" : null })}
          />
          <Check
            label="Requiere DLC"
            checked={filters.requiresDLC ?? false}
            onChange={(v) => update({ dlc: v ? "1" : null })}
          />
        </Group>

        <Group title="Otros" defaultOpen={false}>
          <div>
            <label className="gh-label">Desarrolladora</label>
            <select
              value={filters.developer ?? ""}
              onChange={(e) => update({ developer: e.target.value || null })}
              className="gh-input text-xs"
            >
              <option value="">Todas</option>
              {developers.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2">
            <label className="gh-label">Año de lanzamiento</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="2018"
              value={filters.releaseYear ?? ""}
              onChange={(e) =>
                update({ anio: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="gh-input text-xs"
            />
          </div>
          <div className="mt-2 space-y-0.5">
            <Check
              label="Solo recomendados"
              checked={filters.recommended ?? false}
              onChange={(v) => update({ recomendado: v ? "1" : null })}
            />
            <Check
              label="Solo datos verificados"
              checked={filters.verified ?? false}
              onChange={(v) => update({ verificado: v ? "1" : null })}
            />
          </div>
        </Group>
      </div>
    </>
  );
}

export function SortSelect({
  sort,
  filters,
  base = "/juegos",
}: {
  sort: GameSort;
  filters: GameFilters;
  base?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.toString();

  return (
    <form action={`${base}${q ? `?${q}` : ""}`} className="flex items-center gap-2">
      <IconSort size={15} className="text-base-500" />
      <label htmlFor="orden" className="sr-only">
        Ordenar por
      </label>
      <select
        id="orden"
        name="orden"
        defaultValue={sort}
        onChange={(e) => router.push(buildHref(new URLSearchParams(params.toString()), { orden: e.target.value }, base))}
        className="gh-input w-auto py-1.5 text-xs"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
    </form>
  );
}

const LABELS = FILTER_PARAM_LABELS;

export function ActiveFilters({
  filters,
  total,
  base = "/juegos",
}: {
  filters: GameFilters;
  total: number;
  base?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const chips: { key: string; label: string; value: string }[] = [];
  for (const p of filters.platforms ?? [])
    chips.push({ key: "plataforma", label: "Plataforma", value: p.toUpperCase() });
  for (const c of filters.categories ?? [])
    chips.push({ key: "genero", label: "Género", value: c });
  if (filters.minDifficulty != null)
    chips.push({
      key: "difMin",
      label: "Dificultad",
      value: `≥ ${filters.minDifficulty}`,
    });
  if (filters.maxDifficulty != null)
    chips.push({ key: "difMax", label: "Dificultad", value: `≤ ${filters.maxDifficulty}` });
  if (filters.maxHours != null)
    chips.push({ key: "horas", label: "Horas", value: `≤ ${filters.maxHours}` });
  if (filters.minHours != null)
    chips.push({ key: "horasMin", label: "Horas", value: `≥ ${filters.minHours}` });
  if (filters.minTrophies != null)
    chips.push({ key: "trofeosMin", label: "Trofeos", value: `≥ ${filters.minTrophies}` });
  for (const [k, label] of [
    ["online", "Online"],
    ["perdibles", "Perdibles"],
    ["partidas", "Múltiples partidas"],
    ["grindeo", "Grindeo"],
    ["coleccionables", "Coleccionables"],
    ["dificultadVinculada", "Atados a dificultad"],
    ["maxDificultad", "Máxima dificultad"],
    ["dlc", "Requiere DLC"],
    ["recomendado", "Recomendados"],
    ["verificado", "Verificados"],
  ] as const) {
    if ((filters as any)[k]) chips.push({ key: k, label, value: "Sí" });
  }
  if (filters.developer)
    chips.push({ key: "developer", label: "Dev", value: filters.developer });
  if (filters.releaseYear)
    chips.push({ key: "anio", label: "Año", value: String(filters.releaseYear) });

  const remove = (key: string, value?: string) => {
    const p = new URLSearchParams(params.toString());
    if (value && p.get(key)?.includes(value)) {
      const rest = p
        .get(key)!
        .split(",")
        .filter((x) => x !== value);
      if (rest.length) p.set(key, rest.join(","));
      else p.delete(key);
    } else {
      p.delete(key);
      if (key === "difMin" || key === "difMax") {
        p.delete("difMin");
        p.delete("difMax");
      }
    }
    p.delete("pagina");
    const qs = p.toString();
    router.push(qs ? `${base}?${qs}` : base);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="text-xs text-base-500">{total} resultados</span>
      {chips.map((c, i) => (
        <button
          key={`${c.key}-${c.value}-${i}`}
          type="button"
          onClick={() =>
            remove(
              c.key,
              LABELS[c.key] === "Plataforma" || LABELS[c.key] === "Género" ? c.value : undefined,
            )
          }
          className="gh-chip border-base-600 bg-base-800 text-base-300 transition-colors hover:border-rose-500/40 hover:text-rose-300"
        >
          {c.label}: {c.value}
          <IconX size={10} />
        </button>
      ))}
    </div>
  );
}
