/**
 * Constantes y "enums" de la aplicación.
 *
 * En SQLite Prisma no soporta enums nativos, así que los tipos se validan aquí
 * y la base de datos guarda strings. Al migrar a PostgreSQL puedes convertir
 * cualquiera de estos a `enum` de Prisma sin tocar el resto del código.
 */

export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_GAME_STATUSES = [
  "backlog",
  "playing",
  "completed",
  "abandoned",
] as const;
export type UserGameStatus = (typeof USER_GAME_STATUSES)[number];

export const USER_GAME_STATUS_LABELS: Record<UserGameStatus, string> = {
  backlog: "Pendiente",
  playing: "Jugando",
  completed: "Completado",
  abandoned: "Abandonado",
};

/** platinum | gold | silver | bronze */
export const TROPHY_TYPES = ["platinum", "gold", "silver", "bronze"] as const;
export type TrophyType = (typeof TROPHY_TYPES)[number];

export const TROPHY_TYPE_LABELS: Record<TrophyType, string> = {
  platinum: "Platino",
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
};

/** Orden de "*menor mejor" dentro de la lista de trofeos. */
export const TROPHY_TYPE_ORDER: Record<TrophyType, number> = {
  platinum: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
};

export const TROPHY_TYPE_COLORS: Record<TrophyType, string> = {
  platinum: "text-slate-100 border-slate-400/40 bg-slate-400/10",
  gold: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  silver: "text-slate-300 border-slate-300/30 bg-slate-300/10",
  bronze: "text-orange-300 border-orange-400/30 bg-orange-400/10",
};

/** main_story | story_side | side_content | platinum | completionist */
export const TIME_KINDS = [
  "main_story",
  "story_side",
  "side_content",
  "platinum",
  "completionist",
] as const;
export type TimeKind = (typeof TIME_KINDS)[number];

export const TIME_KIND_LABELS: Record<TimeKind, string> = {
  main_story: "Historia principal",
  story_side: "Historia + secundarias",
  side_content: "Contenido secundario",
  platinum: "Platino completo",
  completionist: "Al 100%",
};

export const TIME_KIND_ORDER: Record<TimeKind, number> = {
  main_story: 0,
  story_side: 1,
  side_content: 2,
  platinum: 3,
  completionist: 4,
};

/**
 * platinum = dificultad para sacar el Platino (lo que más importa aquí)
 * story    = dificultad de la historia en sí
 * game     = dificultad global del juego
 * easy/normal/hard/brutal/master = niveles de dificultad concretos
 */
export const DIFFICULTY_KINDS = [
  "platinum",
  "story",
  "game",
  "easy",
  "normal",
  "hard",
  "brutal",
  "master",
] as const;
export type DifficultyKind = (typeof DIFFICULTY_KINDS)[number];

export const DIFFICULTY_KIND_LABELS: Record<DifficultyKind, string> = {
  platinum: "Platino",
  story: "Historia",
  game: "Juego",
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  brutal: "Muy difícil",
  master: "Máxima dificultad",
};

export const DATA_STATUSES = ["verified", "provisional", "demo"] as const;
export type DataStatus = (typeof DATA_STATUSES)[number];

export const DATA_STATUS_META: Record<
  DataStatus,
  { label: string; description: string; className: string }
> = {
  verified: {
    label: "Verificado",
    description: "Dato contrastado con varias fuentes y con la información oficial.",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  provisional: {
    label: "Provisional",
    description:
      "Estimación obtenida de guías públicas de la comunidad. Puede variar según el jugador.",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  demo: {
    label: "Demo",
    description:
      "Datos de ejemplo incluidos para poder probar la aplicación. No son definitivos.",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
};

export const CONFIDENCE_LEVELS = ["alta", "media", "baja"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_META: Record<
  Confidence,
  { label: string; className: string }
> = {
  alta: { label: "Confianza alta", className: "text-emerald-300" },
  media: { label: "Confianza media", className: "text-amber-300" },
  baja: { label: "Confianza baja", className: "text-rose-300" },
};

export const TROPHY_LIST_COMPLETENESS = ["completa", "parcial", "demo"] as const;
export type TrophyListCompleteness = (typeof TROPHY_LIST_COMPLETENESS)[number];

export const GUIDE_KINDS = ["platino", "trofeo", "general", "inicio"] as const;
export type GuideKind = (typeof GUIDE_KINDS)[number];

export const GUIDE_KIND_LABELS: Record<GuideKind, string> = {
  platino: "Guía de Platino",
  trofeo: "Guía de trofeo",
  general: "Guía general",
  inicio: "Guía de inicio",
};

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Etiquetas de dificultad de juego que un usuario puede registrar. */
export const GAMEPLAY_DIFFICULTIES = [
  "Fácil",
  "Normal",
  "Difícil",
  "Muy difícil",
  "Máxima dificultad",
] as const;
