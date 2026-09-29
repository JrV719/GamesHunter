/**
 * Formato compacto para los datos de demostración.
 *
 * Cada juego se escribe con claves cortas y `normalize()` las expande al formato
 * completo que consume el seed. Esto mantiene los archivos de datos manejables
 * y evita repetir campos opcionales.
 */

export type TrophyType = "platinum" | "gold" | "silver" | "bronze";

/** Trofeo compacto: n=nombre, k=tipo, h=como, d=dificultad, m=missable, o=online, s=momento, nd=dificultad requerida */
export type TrophySeed = {
  n: string;
  k: TrophyType;
  h: string;
  d?: number;
  m?: boolean;
  o?: boolean;
  s?: string;
  nd?: string;
  dl?: boolean;
  desc?: string;
};

export type TimeSeed = {
  k: "main_story" | "story_side" | "side_content" | "platinum" | "completionist";
  l: string;
  min: number;
  max: number;
  note?: string;
};

export type DiffSeed = {
  k: "platinum" | "story" | "game" | "easy" | "normal" | "hard" | "brutal" | "master";
  l: string;
  s: number;
  note?: string;
};

export type GameSeed = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  dev: string;
  pub?: string;
  date: string;
  color: string;
  url?: string;
  dataStatus?: "verified" | "provisional" | "demo";
  pop?: number;
  rec?: string;
  platforms: { slug: string; date?: string; original?: boolean; shared?: boolean; notes?: string }[];
  categories: { slug: string; primary?: boolean }[];
  times: TimeSeed[];
  difficulties: DiffSeed[];
  profile: {
    total: number;
    gold: number;
    silver: number;
    bronze: number;
    hMin: number;
    hMax: number;
    runsMin?: number;
    runsMax?: number;
    grind?: number;
    missables?: boolean;
    online?: boolean;
    diffLinked?: boolean;
    maxDiff?: boolean;
    collectibles?: boolean;
    servers?: boolean;
    psPlus?: boolean;
    dlc?: boolean;
    afterEnding?: boolean;
    missableNote?: string;
    onlineNote?: string;
    quick: string;
    source?: string;
  };
  list: {
    name: string;
    shared?: boolean;
    completeness?: "completa" | "parcial" | "demo";
    notes?: string;
    source?: string;
    trophies: TrophySeed[];
  };
  guide: {
    title: string;
    kind?: "platino" | "trofeo" | "general";
    summary: string;
    steps: { title: string; body: string; warning?: string }[];
  };
  sources: { slug: string; url: string; scope: string; confidence: "alta" | "media" | "baja" }[];
};

// ----------------------------------------------------------------------------
// Expansión al formato completo
// ----------------------------------------------------------------------------

export type FullTrophy = {
  name: string;
  type: TrophyType;
  description?: string;
  howTo: string;
  difficulty: number;
  isMissable: boolean;
  isOnline: boolean;
  recommendedStage: string;
  requiresDifficulty?: string;
  isDLC: boolean;
};

export type FullGame = Omit<GameSeed, "dev" | "pub" | "date" | "color" | "url" | "pop" | "rec" | "platforms" | "categories" | "times" | "difficulties" | "profile" | "list" | "guide" | "sources" | "dataStatus"> & {
  developer: string;
  publisher?: string;
  releaseDate: string;
  accentColor: string;
  officialUrl?: string;
  dataStatus: string;
  popularity: number;
  recommended: boolean;
  recommendationNote?: string;
  platforms: { slug: string; sharesTrophyList: boolean; notes?: string; releaseDate?: string; isOriginal: boolean }[];
  categories: { slug: string; primary: boolean }[];
  times: { kind: string; label: string; min: number; max: number; note?: string }[];
  difficulties: { kind: string; label: string; score: number; note?: string }[];
  profile: Record<string, unknown>;
  trophyList: {
    name: string;
    isShared: boolean;
    completeness: string;
    notes?: string;
    sourceSlug: string;
    trophies: FullTrophy[];
  };
  guide: { title: string; kind: string; summary: string; steps: { title: string; body: string; warning?: string }[] };
  dataSources: { slug: string; url: string; scope: string; confidence: string }[];
};

export function normalize(g: GameSeed): FullGame {
  return {
    slug: g.slug,
    title: g.title,
    tagline: g.tagline,
    summary: g.summary,
    description: g.description,
    developer: g.dev,
    publisher: g.pub,
    releaseDate: g.date,
    accentColor: g.color,
    officialUrl: g.url,
    dataStatus: g.dataStatus ?? "provisional",
    popularity: g.pop ?? 100,
    recommended: Boolean(g.rec),
    recommendationNote: g.rec,
    platforms: g.platforms.map((p) => ({
      slug: p.slug,
      sharesTrophyList: p.shared !== false,
      notes: p.notes,
      releaseDate: p.date,
      isOriginal: Boolean(p.original),
    })),
    categories: g.categories.map((c) => ({ slug: c.slug, primary: Boolean(c.primary) })),
    times: g.times.map((t) => ({
      kind: t.k as string,
      label: t.l,
      min: t.min,
      max: t.max,
      note: t.note,
    })),
    difficulties: g.difficulties.map((d) => ({
      kind: d.k as string,
      label: d.l,
      score: d.s,
      note: d.note,
    })),
    profile: g.profile,
    trophyList: {
      name: g.list.name,
      isShared: g.list.shared !== false,
      completeness: g.list.completeness ?? "parcial",
      notes: g.list.notes,
      sourceSlug: g.list.source ?? "psnprofiles",
      trophies: g.list.trophies.map((t) => ({
        name: t.n,
        type: t.k,
        description: t.desc,
        howTo: t.h,
        difficulty: t.d ?? 3,
        isMissable: Boolean(t.m),
        isOnline: Boolean(t.o),
        recommendedStage: t.s ?? "Cualquier momento",
        requiresDifficulty: t.nd,
        isDLC: Boolean(t.dl),
      })),
    },
    guide: {
      title: g.guide.title,
      kind: g.guide.kind ?? "platino",
      summary: g.guide.summary,
      steps: g.guide.steps,
    },
    dataSources: g.sources,
  };
}
