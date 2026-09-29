/**
 * Tipos y constantes del buscador.
 * Este módulo NO importa "server-only": lo comparten los componentes de cliente
 * (filtros, orden, paginación) y la capa de consultas del servidor.
 */

export const SORTS = [
  "relevance",
  "name",
  "difficulty_asc",
  "difficulty_desc",
  "platinum_hours_asc",
  "platinum_hours_desc",
  "trophies_asc",
  "trophies_desc",
  "release_desc",
  "release_asc",
  "popularity",
  "newest",
] as const;

export type GameSort = (typeof SORTS)[number];

export const SORT_LABELS: Record<GameSort, string> = {
  relevance: "Relevancia",
  name: "Nombre (A-Z)",
  difficulty_asc: "Platino: más fácil",
  difficulty_desc: "Platino: más difícil",
  platinum_hours_asc: "Platino: menos horas",
  platinum_hours_desc: "Platino: más horas",
  trophies_asc: "Menos trofeos",
  trophies_desc: "Más trofeos",
  release_desc: "Lanzamiento: más reciente",
  release_asc: "Lanzamiento: más antiguo",
  popularity: "Popularidad",
  newest: "Añadidos recientemente",
};

export type GameFilters = {
  q?: string;
  platforms?: string[];
  categories?: string[];
  minDifficulty?: number;
  maxDifficulty?: number;
  minHours?: number;
  maxHours?: number;
  minTrophies?: number;
  maxTrophies?: number;
  minGold?: number;
  minSilver?: number;
  minBronze?: number;
  online?: boolean;
  missables?: boolean;
  grind?: boolean;
  multiplePlaythroughs?: boolean;
  collectibles?: boolean;
  difficultyLinked?: boolean;
  requiresMaxDifficulty?: boolean;
  requiresDLC?: boolean;
  developer?: string;
  releaseYear?: number;
  releaseFrom?: string;
  releaseTo?: string;
  recommended?: boolean;
  verified?: boolean;
};

export const PAGE_SIZE = 24;

/** Etiquetas legibles de los parámetros de la URL. */
export const FILTER_PARAM_LABELS: Record<string, string> = {
  plataforma: "Plataforma",
  genero: "Género",
  difMin: "Dificultad mín.",
  difMax: "Dificultad máx.",
  horas: "Máx. horas",
  horasMin: "Mín. horas",
  trofeosMin: "Trofeos mín.",
  trofeosMax: "Trofeos máx.",
  oro: "Oro mín.",
  plata: "Plata mín.",
  bronce: "Bronce mín.",
  online: "Online",
  perdibles: "Perdibles",
  partidas: "Múltiples partidas",
  grindeo: "Grindeo",
  coleccionables: "Coleccionables",
  dificultadVinculada: "Atados a la dificultad",
  maxDificultad: "Máxima dificultad",
  dlc: "Requiere DLC",
  developer: "Desarrolladora",
  anio: "Año",
  desde: "Desde",
  hasta: "Hasta",
  recomendado: "Recomendados",
  verificado: "Verificados",
};
