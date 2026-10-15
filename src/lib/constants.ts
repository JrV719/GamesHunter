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

// ===========================================================================
// Estado editorial de un juego
// ===========================================================================

/**
 * `upcoming` = «Próximamente». Es un estado editorial más, no un dato del
 * juego: el juego existe en la base (para poder preparar su ficha) pero no
 * aparece en el catálogo público ni en el sitemap hasta pasar a `published`.
 */
export const GAME_STATUSES = ["draft", "upcoming", "published", "archived"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  draft: "Borrador",
  upcoming: "Próximamente",
  published: "Publicado",
  archived: "Archivado",
};

export const GAME_STATUS_META: Record<
  GameStatus,
  { label: string; className: string; public: boolean }
> = {
  draft: {
    label: "Borrador",
    className: "border-base-600 bg-base-800 text-base-400",
    public: false,
  },
  upcoming: {
    label: "Próximamente",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    public: false,
  },
  published: {
    label: "Publicado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    public: true,
  },
  archived: {
    label: "Archivado",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    public: false,
  },
};

// ===========================================================================
// Comunidad: foro, opiniones y comentarios
// ===========================================================================

/**
 * `opinion` son las opiniones sobre un juego: aparecen también en su ficha.
 * El resto son hilos del foro, que pueden asociarse a un juego o no.
 */
export const POST_KINDS = ["post", "opinion", "question", "tip"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const POST_KIND_LABELS: Record<PostKind, string> = {
  post: "Publicación",
  opinion: "Opinión",
  question: "Pregunta",
  tip: "Consejo",
};

/**
 * `published` visible para todos. `hidden` solo lo ven moderadores y
 * administradores (se usa desde «moderar»). Nunca se borra físicamente: así
 * las respuestas huérfanas conservan el hilo y siempre hay trazabilidad.
 */
export const COMMUNITY_STATUSES = ["published", "hidden"] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];

export const COMMUNITY_STATUS_LABELS: Record<CommunityStatus, string> = {
  published: "Publicado",
  hidden: "Oculto",
};

export const REPORT_REASONS = [
  "spam",
  "insulto",
  "spoiler",
  "info-falsa",
  "otro",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam o publicidad",
  insulto: "Lenguaje ofensivo",
  spoiler: "Spoiler sin avisar",
  "info-falsa": "Información incorrecta",
  otro: "Otro motivo",
};

export const POST_SORTS = [
  "recientes",
  "populares",
  "comentados",
  "sin-respuesta",
] as const;
export type PostSort = (typeof POST_SORTS)[number];

export const POST_SORT_LABELS: Record<PostSort, string> = {
  recientes: "Más recientes",
  populares: "Más votados",
  comentados: "Más comentados",
  "sin-respuesta": "Sin respuesta",
};

export const COMMUNITY_PAGE_SIZE = 12;

/** Límites de longitud. Se validan en el servidor, no solo en el formulario. */
export const COMMUNITY_LIMITS = {
  postTitleMin: 4,
  postTitleMax: 140,
  postBodyMin: 20,
  postBodyMax: 8000,
  commentMin: 2,
  commentMax: 4000,
  profileBioMax: 400,
} as const;
