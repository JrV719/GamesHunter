import type { GameFilters } from "@/lib/filters";

/** Utilidades para traducir los searchParams de la URL a filtros. */

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export const toList = (v: string | string[] | undefined): string[] =>
  !v
    ? []
    : (Array.isArray(v) ? v : v.split(","))
        .map((x) => x.trim())
        .filter(Boolean);

export const toNum = (v: string | string[] | undefined) => {
  const s = first(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export const toBool = (v: string | string[] | undefined) => first(v) === "1";

/** Traduce los searchParams de la URL a los filtros del buscador. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): GameFilters {
  return {
    q: first(sp.q),
    platforms: toList(sp.plataforma),
    categories: toList(sp.genero),
    minDifficulty: toNum(sp.difMin),
    maxDifficulty: toNum(sp.difMax),
    minHours: toNum(sp.horasMin),
    maxHours: toNum(sp.horas),
    minTrophies: toNum(sp.trofeosMin),
    maxTrophies: toNum(sp.trofeosMax),
    minGold: toNum(sp.oro),
    minSilver: toNum(sp.plata),
    minBronze: toNum(sp.bronce),
    online: toBool(sp.online),
    missables: toBool(sp.perdibles),
    grind: toBool(sp.grindeo),
    multiplePlaythroughs: toBool(sp.partidas),
    collectibles: toBool(sp.coleccionables),
    difficultyLinked: toBool(sp.dificultadVinculada),
    requiresMaxDifficulty: toBool(sp.maxDificultad),
    requiresDLC: toBool(sp.dlc),
    developer: first(sp.developer),
    releaseYear: toNum(sp.anio),
    releaseFrom: first(sp.desde),
    releaseTo: first(sp.hasta),
    recommended: toBool(sp.recomendado),
    verified: toBool(sp.verificado),
  };
}
