/**
 * Tipos de fila de la base de datos.
 * Reflejan 1:1 las tablas de database/schema.sql.
 */

export type Row = Record<string, any>;

export type Platform = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  sortOrder: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  gameCount?: number;
};

export type Developer = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
};

export type Publisher = {
  id: string;
  slug: string;
  name: string;
};

export type GameStatus = "draft" | "published" | "archived";
export type DataStatus = "verified" | "provisional" | "demo";

export type Game = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  summary: string;
  description: string;
  developerId: string;
  publisherId: string | null;
  releaseDate: string | null;
  accentColor: string;
  coverImage: string | null;
  heroImage: string | null;
  officialUrl: string | null;
  status: GameStatus;
  dataStatus: DataStatus;
  isFeatured: boolean;
  isRecommended: boolean;
  recommendationNote: string | null;
  popularity: number;
  viewCount: number;
  searchText: string;
  createdAt: string;
  updatedAt: string;
};

export type GamePlatform = {
  gameId: string;
  platformId: string;
  sharesTrophyList: boolean;
  notes: string | null;
  platform: Platform;
};

export type GameTime = {
  id: string;
  gameId: string;
  platformId: string | null;
  kind: string;
  label: string;
  minHours: number;
  maxHours: number;
  note: string | null;
  sortOrder: number;
};

export type DifficultyRating = {
  id: string;
  gameId: string;
  kind: string;
  label: string;
  score: number;
  note: string | null;
  sortOrder: number;
};

export type PlatinumProfile = {
  gameId: string;
  totalTrophies: number;
  platinumCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  estimatedHoursMin: number | null;
  estimatedHoursMax: number | null;
  playthroughsMin: number | null;
  playthroughsMax: number | null;
  grindRating: number | null;
  hasMissables: boolean;
  hasOnline: boolean;
  hasMissableOnline: boolean;
  difficultyLinked: boolean;
  requiresMaxDifficulty: boolean;
  hasCollectibles: boolean;
  requiresActiveServers: boolean;
  requiresPSPlus: boolean;
  requiresDLC: boolean;
  platinumAfterEnding: boolean;
  missableTrophies: string | null;
  onlineTrophies: string | null;
  difficultyTrophies: string | null;
  quickSummary: string | null;
  sourceId: string | null;
};

export type Trophy = {
  id: string;
  slug: string;
  name: string;
  type: "platinum" | "gold" | "silver" | "bronze";
  iconUrl: string | null;
  officialDescription: string | null;
  gameId: string;
};

export type TrophyList = {
  id: string;
  gameId: string;
  platformId: string | null;
  name: string;
  isShared: boolean;
  isDefault: boolean;
  totalCount: number;
  completeness: string;
  notes: string | null;
  platform?: Platform | null;
};

export type GameTrophy = {
  id: string;
  gameId: string;
  trophyListId: string;
  trophyId: string;
  sortOrder: number;
  howTo: string;
  difficulty: number;
  isMissable: boolean;
  isOnline: boolean;
  recommendedStage: string;
  requiresDifficulty: string | null;
  isDLC: boolean;
  isUnobtainable: boolean;
  note: string | null;
  sourceId: string | null;
};

export type GuideStep = {
  id: string;
  guideId: string;
  stepNumber: number;
  title: string;
  body: string;
  warning: string | null;
  sortOrder: number;
};

export type Guide = {
  id: string;
  slug: string;
  gameId: string | null;
  kind: string;
  title: string;
  summary: string;
  body: string;
  status: string;
  dataStatus: string;
  isCommunity: boolean;
  authorId: string | null;
  readingTime: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuideSource = {
  id: string;
  slug: string;
  name: string;
  homepage: string | null;
  logoUrl: string | null;
  usagePolicy: string;
  allowsCopy: boolean;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type GuideSourceRef = {
  id: string;
  guideId: string;
  sourceId: string;
  url: string;
  lastUpdated: string | null;
  confidence: string;
  scope: string | null;
  note: string | null;
};

export type DataProvenance = {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  sourceId: string | null;
  sourceUrl: string | null;
  lastUpdated: string;
  confidence: string;
  dataStatus: string;
  note: string | null;
};

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  passwordHash: string;
  role: "user" | "moderator" | "admin";
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

/** Fila de "tarjeta de juego" que devuelve la capa de consultas. */
export type GameCard = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  coverImage: string | null;
  accentColor: string;
  releaseDate: string | null;
  dataStatus: DataStatus;
  popularity: number;
  createdAt: string;
  developerName: string;
  developerSlug: string;
  platforms: { slug: string; name: string; shortName: string }[];
  categories: { slug: string; name: string; isPrimary: boolean }[];
  platinumDifficulty: number | null;
  platinumDifficultyNote: string | null;
  totalTrophies: number | null;
  goldCount: number | null;
  silverCount: number | null;
  bronzeCount: number | null;
  hoursMin: number | null;
  hoursMax: number | null;
  hasMissables: boolean;
  hasOnline: boolean;
  grindRating: number | null;
};
