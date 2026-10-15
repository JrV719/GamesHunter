import "server-only";
import { all, one, type SqlParam } from "@/lib/db";
import type { GameCard, Game, DataProvenance, Category, Row } from "@/lib/db-types";
import { buildQueryTerms } from "@/lib/utils";
import { SORTS, SORT_LABELS, PAGE_SIZE, type GameFilters, type GameSort } from "@/lib/filters";

export { SORTS, SORT_LABELS, PAGE_SIZE };
export type { GameFilters, GameSort };

// ============================================================================
// SELECT BASE DE TARJETA
// ----------------------------------------------------------------------------
// Devuelve todos los datos necesarios para pintar una tarjeta de juego en una
// sola consulta, sin N+1. Las plataformas y categorias llegan como JSON.
// ============================================================================

const CARD_SELECT = `
  SELECT
    g.id, g.slug, g.title, g.tagline, g.cover_image AS coverImage,
    g.accent_color AS accentColor, g.release_date AS releaseDate,
    g.data_status AS dataStatus, g.popularity, g.created_at AS createdAt,
    d.name AS developerName, d.slug AS developerSlug,
    (SELECT json_group_array(json_object('slug', p.slug, 'name', p.name, 'shortName', p.short_name))
       FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id
      WHERE gp.game_id = g.id) AS platformsJson,
    (SELECT json_group_array(json_object('slug', c.slug, 'name', c.name, 'isPrimary', gc.is_primary))
       FROM game_categories gc JOIN categories c ON c.id = gc.category_id
      WHERE gc.game_id = g.id) AS categoriesJson,
    (SELECT dr.score FROM difficulty_ratings dr
      WHERE dr.game_id = g.id AND dr.kind = 'platinum'
      ORDER BY dr.sort_order LIMIT 1) AS platinumDifficulty,
    (SELECT dr.note FROM difficulty_ratings dr
      WHERE dr.game_id = g.id AND dr.kind = 'platinum'
      ORDER BY dr.sort_order LIMIT 1) AS platinumDifficultyNote,
    pp.total_trophies AS totalTrophies,
    pp.gold_count AS goldCount, pp.silver_count AS silverCount, pp.bronze_count AS bronzeCount,
    pp.estimated_hours_min AS hoursMin, pp.estimated_hours_max AS hoursMax,
    COALESCE(pp.has_missables, 0) AS hasMissables,
    COALESCE(pp.has_online, 0) AS hasOnline,
    pp.grind_rating AS grindRating
  FROM games g
  JOIN developers d ON d.id = g.developer_id
  LEFT JOIN platinum_profiles pp ON pp.game_id = g.id
`;

type RawCard = Omit<GameCard, "platforms" | "categories" | "hasMissables" | "hasOnline"> & {
  platformsJson: string | null;
  categoriesJson: string | null;
  hasMissables: number;
  hasOnline: number;
};

function mapCard(r: RawCard): GameCard {
  return {
    ...r,
    platforms: r.platformsJson ? (JSON.parse(r.platformsJson) as GameCard["platforms"]) : [],
    categories: r.categoriesJson ? (JSON.parse(r.categoriesJson) as GameCard["categories"]) : [],
    hasMissables: Boolean(r.hasMissables),
    hasOnline: Boolean(r.hasOnline),
  };
}

// ============================================================================
// FILTROS
// ----------------------------------------------------------------------------
// SORTS / SORT_LABELS / GameFilters / GameSort viven en @/lib/filters para que
// los componentes de cliente puedan importarlos sin arrastrar "server-only".
// ============================================================================

type Built = { where: string; params: SqlParam[] };

/** Traduce los filtros de la UI a un WHERE de SQL parametrizado. */
export function buildGameWhere(
  filters: GameFilters,
  opts: { includeUnpublished?: boolean } = {},
): Built {
  const p: SqlParam[] = [];
  const conds: string[] = [];

  if (!opts.includeUnpublished) conds.push("g.status = 'published'");

  // Búsqueda por texto. searchText está normalizado (minúsculas, sin acentos).
  const terms = filters.q ? buildQueryTerms(filters.q) : [];
  for (const term of terms) {
    conds.push("g.search_text LIKE ?");
    p.push(`%${term}%`);
  }

  if (filters.platforms?.length) {
    conds.push(`EXISTS (SELECT 1 FROM game_platforms fgp JOIN platforms fp ON fp.id = fgp.platform_id
      WHERE fgp.game_id = g.id AND fp.slug IN (${filters.platforms.map(() => "?").join(",")}))`);
    p.push(...filters.platforms);
  }

  if (filters.categories?.length) {
    conds.push(`EXISTS (SELECT 1 FROM game_categories fgc JOIN categories fc ON fc.id = fgc.category_id
      WHERE fgc.game_id = g.id AND fc.slug IN (${filters.categories.map(() => "?").join(",")}))`);
    p.push(...filters.categories);
  }

  // --- Dificultad del Platino (1..10) sobre la subconsulta ya proyectada
  const diff = "COALESCE((SELECT dr.score FROM difficulty_ratings dr WHERE dr.game_id = g.id AND dr.kind = 'platinum' ORDER BY dr.sort_order LIMIT 1), 0)";
  if (filters.minDifficulty != null) {
    conds.push(`${diff} >= ?`);
    p.push(filters.minDifficulty);
  }
  if (filters.maxDifficulty != null) {
    conds.push(`${diff} <= ?`);
    p.push(filters.maxDifficulty);
  }

  // --- Tiempo estimado del Platino
  if (filters.minHours != null) {
    conds.push("COALESCE(pp.estimated_hours_max, 9999) >= ?");
    p.push(filters.minHours);
  }
  if (filters.maxHours != null) {
    conds.push("COALESCE(pp.estimated_hours_max, 0) <= ?");
    p.push(filters.maxHours);
  }

  // --- Nº de trofeos
  if (filters.minTrophies != null) {
    conds.push("COALESCE(pp.total_trophies, 0) >= ?");
    p.push(filters.minTrophies);
  }
  if (filters.maxTrophies != null) {
    conds.push("COALESCE(pp.total_trophies, 0) <= ?");
    p.push(filters.maxTrophies);
  }

  // --- Reparto oro/plata/bronce
  for (const [key, col] of [
    ["minGold", "gold_count"],
    ["minSilver", "silver_count"],
    ["minBronze", "bronze_count"],
  ] as const) {
    const v = filters[key];
    if (v != null) {
      conds.push(`COALESCE(pp.${col}, 0) >= ?`);
      p.push(v);
    }
  }

  // --- Flags del Platino
  if (filters.online) conds.push("pp.has_online = 1");
  if (filters.missables) conds.push("pp.has_missables = 1");
  if (filters.collectibles) conds.push("pp.has_collectibles = 1");
  if (filters.difficultyLinked) conds.push("pp.difficulty_linked = 1");
  if (filters.requiresMaxDifficulty) conds.push("pp.requires_max_difficulty = 1");
  if (filters.requiresDLC) conds.push("pp.requires_dlc = 1");
  if (filters.grind) conds.push("COALESCE(pp.grind_rating, 0) >= 6");
  if (filters.multiplePlaythroughs) {
    conds.push("(COALESCE(pp.playthroughs_max, 1) > 1 OR COALESCE(pp.grind_rating, 0) >= 7)");
  }

  if (filters.developer) {
    conds.push("d.slug = ?");
    p.push(filters.developer);
  }

  if (filters.releaseYear) {
    conds.push("g.release_date >= ? AND g.release_date < ?");
    p.push(`${filters.releaseYear}-01-01`, `${filters.releaseYear + 1}-01-01`);
  }
  if (filters.releaseFrom) {
    conds.push("g.release_date >= ?");
    p.push(filters.releaseFrom);
  }
  if (filters.releaseTo) {
    conds.push("g.release_date <= ?");
    p.push(filters.releaseTo);
  }

  if (filters.recommended) conds.push("g.is_recommended = 1");
  if (filters.verified) conds.push("g.data_status = 'verified'");

  return {
    where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "",
    params: p,
  };
}

const DIFF_EXPR =
  "COALESCE((SELECT dr.score FROM difficulty_ratings dr WHERE dr.game_id = g.id AND dr.kind = 'platinum' ORDER BY dr.sort_order LIMIT 1), 5)";

export function buildGameOrderBy(sort: GameSort): string {
  switch (sort) {
    case "name":
      return "ORDER BY g.title COLLATE NOCASE ASC";
    case "difficulty_asc":
      return `ORDER BY ${DIFF_EXPR} ASC, g.title ASC`;
    case "difficulty_desc":
      return `ORDER BY ${DIFF_EXPR} DESC, g.title ASC`;
    case "platinum_hours_asc":
      return "ORDER BY pp.estimated_hours_max IS NULL, pp.estimated_hours_max ASC, g.title ASC";
    case "platinum_hours_desc":
      return "ORDER BY pp.estimated_hours_max IS NULL, pp.estimated_hours_max DESC, g.title ASC";
    case "trophies_asc":
      return "ORDER BY pp.total_trophies IS NULL, pp.total_trophies ASC, g.title ASC";
    case "trophies_desc":
      return "ORDER BY pp.total_trophies IS NULL, pp.total_trophies DESC, g.title ASC";
    case "release_desc":
      return "ORDER BY g.release_date IS NULL, g.release_date DESC, g.title ASC";
    case "release_asc":
      return "ORDER BY g.release_date IS NULL, g.release_date ASC, g.title ASC";
    case "newest":
      return "ORDER BY g.created_at DESC, g.title ASC";
    case "popularity":
    case "relevance":
    default:
      return "ORDER BY g.popularity DESC, g.created_at DESC, g.title ASC";
  }
}

// ============================================================================
// CONSULTAS
// ============================================================================

export async function listGames(opts: {
  filters?: GameFilters;
  sort?: GameSort;
  page?: number;
  pageSize?: number;
  includeUnpublished?: boolean;
}) {
  const filters = opts.filters ?? {};
  const sort = opts.sort ?? "relevance";
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const { where, params } = buildGameWhere(filters, { includeUnpublished: opts.includeUnpublished });

  const countRow = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM games g
     JOIN developers d ON d.id = g.developer_id
     LEFT JOIN platinum_profiles pp ON pp.game_id = g.id${where}`,
    params,
  );
  const total = countRow?.n ?? 0;

  const rows = await all<RawCard>(
    `${CARD_SELECT}${where} ${buildGameOrderBy(sort)} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );

  return {
    games: rows.map(mapCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getGameCardBySlug(slug: string): Promise<GameCard | null> {
  const row = await one<RawCard>(`${CARD_SELECT} WHERE g.slug = ? AND g.status = 'published'`, [slug]);
  return row ? mapCard(row) : null;
}

async function collect(
  extraWhere: string,
  order: string,
  limit: number,
): Promise<GameCard[]> {
  const rows = await all<RawCard>(
    `${CARD_SELECT} WHERE g.status = 'published'${extraWhere} ${order} LIMIT ?`,
    [limit],
  );
  return rows.map(mapCard);
}

export async function getHomeCollections() {
  const [popular, recent, easy, hard, quick, recommended] = await Promise.all([
    collect("", "ORDER BY g.popularity DESC", 8),
    collect("", "ORDER BY g.created_at DESC", 8),
    collect(
      ` AND COALESCE((SELECT dr.score FROM difficulty_ratings dr WHERE dr.game_id = g.id AND dr.kind = 'platinum' LIMIT 1), 0) <= 4`,
      `ORDER BY ${DIFF_EXPR} ASC`,
      8,
    ),
    collect(
      ` AND COALESCE((SELECT dr.score FROM difficulty_ratings dr WHERE dr.game_id = g.id AND dr.kind = 'platinum' LIMIT 1), 0) >= 8`,
      `ORDER BY ${DIFF_EXPR} DESC`,
      8,
    ),
    collect(
      " AND pp.estimated_hours_max IS NOT NULL",
      "ORDER BY pp.estimated_hours_max ASC",
      8,
    ),
    collect(" AND g.is_recommended = 1", "ORDER BY g.popularity DESC", 8),
  ]);
  return { popular, recent, easy, hard, quick, recommended };
}

export async function getSiteStats() {
  const row = await one<{
    games: number;
    trophies: number;
    guides: number;
    platforms: number;
    sources: number;
  }>(`SELECT
        (SELECT COUNT(*) FROM games WHERE status = 'published') AS games,
        (SELECT COUNT(*) FROM trophies) AS trophies,
        (SELECT COUNT(*) FROM guides WHERE status = 'published') AS guides,
        (SELECT COUNT(*) FROM platforms) AS platforms,
        (SELECT COUNT(*) FROM guide_sources WHERE is_active = 1) AS sources`);
  return row ?? { games: 0, trophies: 0, guides: 0, platforms: 0, sources: 0 };
}

export async function getAllGameSlugs() {
  return await all<{ slug: string; updatedAt: string }>(
    "SELECT slug, updated_at AS updatedAt FROM games WHERE status = 'published' ORDER BY updated_at DESC",
  );
}

// ----------------------------------------------------------------------------
// Detalle completo
// ----------------------------------------------------------------------------

/** Columnas del juego con alias en camelCase (coherente con db-types.ts). */
const GAME_COLUMNS = `
  g.id, g.slug, g.title, g.tagline, g.summary, g.description,
  g.developer_id AS developerId, g.publisher_id AS publisherId,
  g.release_date AS releaseDate, g.cover_image AS coverImage, g.hero_image AS heroImage,
  g.accent_color AS accentColor, g.official_url AS officialUrl, g.trailer_url AS trailerUrl,
  g.status, g.data_status AS dataStatus, g.is_featured AS isFeatured,
  g.is_recommended AS isRecommended, g.recommendation_note AS recommendationNote,
  g.popularity, g.view_count AS viewCount, g.search_text AS searchText,
  g.created_at AS createdAt, g.updated_at AS updatedAt
`;

/** Columnas de la ficha de platino con alias en camelCase. */
const PROFILE_COLUMNS = `
  game_id AS gameId, total_trophies AS totalTrophies, platinum_count AS platinumCount,
  gold_count AS goldCount, silver_count AS silverCount, bronze_count AS bronzeCount,
  estimated_hours_min AS estimatedHoursMin, estimated_hours_max AS estimatedHoursMax,
  playthroughs_min AS playthroughsMin, playthroughs_max AS playthroughsMax,
  grind_rating AS grindRating, has_missables AS hasMissables, has_online AS hasOnline,
  has_missable_online AS hasMissableOnline, difficulty_linked AS difficultyLinked,
  requires_max_difficulty AS requiresMaxDifficulty, has_collectibles AS hasCollectibles,
  requires_active_servers AS requiresActiveServers, requires_ps_plus AS requiresPSPlus,
  requires_dlc AS requiresDLC, platinum_after_ending AS platinumAfterEnding,
  missable_trophies AS missableTrophies, online_trophies AS onlineTrophies,
  difficulty_trophies AS difficultyTrophies, quick_summary AS quickSummary, source_id AS sourceId
`;

const TIME_COLUMNS = `
  id, game_id AS gameId, platform_id AS platformId, kind, label,
  min_hours AS minHours, max_hours AS maxHours, note, sort_order AS sortOrder
`;

const DIFFICULTY_COLUMNS = `
  id, game_id AS gameId, kind, label, score, note, sort_order AS sortOrder
`;

/** Plataformas del juego, ya aplanadas al formato que consume la vista. */
async function fetchGamePlatforms(gameId: string) {
  const rows = await all<Row>(
    `SELECT gp.game_id AS gameId, gp.platform_id AS platformId,
            gp.shares_trophy_list AS sharesTrophyList, gp.notes,
            p.slug AS platformSlug, p.name AS platformName,
            p.short_name AS platformShortName, p.sort_order AS platformSortOrder
       FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id
      WHERE gp.game_id = ? ORDER BY p.sort_order`,
    [gameId],
  );
  return rows.map((r) => ({
    gameId: r.gameId as string,
    platformId: r.platformId as string,
    sharesTrophyList: Boolean(r.sharesTrophyList),
    notes: (r.notes as string | null) ?? null,
    platform: {
      id: r.platformId as string,
      slug: r.platformSlug as string,
      name: r.platformName as string,
      shortName: r.platformShortName as string,
      sortOrder: (r.platformSortOrder as number) ?? 0,
    },
  }));
}

export async function getGameDetail(slug: string) {
  const game = await one<Game>(`SELECT ${GAME_COLUMNS} FROM games g WHERE g.slug = ? AND g.status = 'published'`, [
    slug,
  ]);
  if (!game) return null;

  const [developer, publisher, platforms, releases, categories, times, difficulties, profile, trophyLists, guides, provenance] =
    await Promise.all([
      one<{ id: string; slug: string; name: string; country: string | null }>(
        "SELECT id, slug, name, country FROM developers WHERE id = ?",
        [game.developerId],
      ),
      game.publisherId
        ? one<{ id: string; slug: string; name: string }>(
            "SELECT id, slug, name FROM publishers WHERE id = ?",
            [game.publisherId],
          )
        : Promise.resolve(null),
      fetchGamePlatforms(game.id),
      all<Row>(
        `SELECT r.*, p.slug AS platformSlug, p.short_name AS platformShortName, p.name AS platformName
           FROM game_releases r JOIN platforms p ON p.id = r.platform_id
          WHERE r.game_id = ? ORDER BY p.sort_order`,
        [game.id],
      ),
      all<Row & { isPrimary: boolean }>(
        `SELECT c.id, c.slug, c.name, c.description, c.icon, c.sort_order AS sortOrder,
                gc.is_primary AS isPrimary
           FROM game_categories gc JOIN categories c ON c.id = gc.category_id
          WHERE gc.game_id = ? ORDER BY gc.is_primary DESC, c.sort_order`,
        [game.id],
      ),
      all<Row>(`SELECT ${TIME_COLUMNS} FROM game_times WHERE game_id = ? ORDER BY sort_order`, [
        game.id,
      ]),
      all<Row>(`SELECT ${DIFFICULTY_COLUMNS} FROM difficulty_ratings WHERE game_id = ? ORDER BY sort_order`, [
        game.id,
      ]),
      one<Row>(`SELECT ${PROFILE_COLUMNS} FROM platinum_profiles WHERE game_id = ?`, [game.id]),
      all<Row & { entries: Row[] }>(
        `SELECT tl.id, tl.game_id AS gameId, tl.platform_id AS platformId, tl.name,
                tl.is_shared AS isShared, tl.is_default AS isDefault, tl.total_count AS totalCount,
                tl.completeness, tl.notes,
                p.slug AS platformSlug, p.name AS platformName, p.short_name AS platformShortName
           FROM trophy_lists tl LEFT JOIN platforms p ON p.id = tl.platform_id
          WHERE tl.game_id = ? ORDER BY tl.is_default DESC`,
        [game.id],
      ),
      all<Row>(
        `SELECT gu.id, gu.slug, gu.game_id AS gameId, gu.kind, gu.title, gu.summary, gu.body,
                gu.status, gu.data_status AS dataStatus, gu.is_community AS isCommunity,
                gu.author_id AS authorId, gu.reading_time AS readingTime, gu.view_count AS viewCount,
                gu.published_at AS publishedAt, gu.created_at AS createdAt, gu.updated_at AS updatedAt,
                u.username AS authorUsername, u.display_name AS authorDisplayName
           FROM guides gu LEFT JOIN users u ON u.id = gu.author_id
          WHERE gu.game_id = ? AND gu.status = 'published' ORDER BY gu.published_at DESC`,
        [game.id],
      ),
      all<DataProvenance & { sourceName: string | null }>(
        `SELECT dp.id, dp.entity_type AS entityType, dp.entity_id AS entityId, dp.field,
                dp.source_id AS sourceId, dp.source_url AS sourceUrl,
                dp.last_updated AS lastUpdated, dp.confidence, dp.data_status AS dataStatus,
                dp.note, gs.name AS sourceName
           FROM data_provenance dp LEFT JOIN guide_sources gs ON gs.id = dp.source_id
          WHERE dp.entity_type = 'game' AND dp.entity_id = ? ORDER BY dp.field`,
        [game.id],
      ),
    ]);

  // Trofeos de cada lista
  for (const list of trophyLists) {
    list.entries = await all<Row>(
      `SELECT gt.id, gt.game_id AS gameId, gt.trophy_list_id AS trophyListId, gt.trophy_id AS trophyId,
              gt.sort_order AS sortOrder, gt.how_to AS howTo, gt.difficulty,
              gt.is_missable AS isMissable, gt.is_online AS isOnline,
              gt.recommended_stage AS recommendedStage, gt.requires_difficulty AS requiresDifficulty,
              gt.is_dlc AS isDLC, gt.is_unobtainable AS isUnobtainable, gt.note,
              t.name AS trophyName, t.type AS trophyType, t.icon_url AS trophyIconUrl,
              t.official_description AS trophyOfficialDescription,
              gs.name AS sourceName, gs.homepage AS sourceHomepage
         FROM game_trophies gt JOIN trophies t ON t.id = gt.trophy_id
         LEFT JOIN guide_sources gs ON gs.id = gt.source_id
        WHERE gt.trophy_list_id = ? ORDER BY gt.sort_order`,
      [list.id],
    );
  }

  // Fuentes y pasos de las guías
  for (const g of guides) {
    g.steps = await all<Row>(
      `SELECT id, guide_id AS guideId, step_number AS stepNumber, title, body, warning,
              sort_order AS sortOrder
         FROM guide_steps WHERE guide_id = ? ORDER BY step_number`,
      [g.id],
    );
    g.sources = await all<Row>(
      `SELECT gsr.id, gsr.url, gsr.scope, gsr.confidence, gsr.last_updated AS lastUpdated,
              gs.name AS sourceName, gs.slug AS sourceSlug, gs.homepage AS sourceHomepage,
              gs.usage_policy AS usagePolicy
         FROM guide_source_refs gsr JOIN guide_sources gs ON gs.id = gsr.source_id
        WHERE gsr.guide_id = ?`,
      [g.id],
    );
  }

  return {
    ...game,
    developer,
    publisher,
    platforms,
    releases,
    categories,
    times,
    difficulties,
    profile,
    trophyLists,
    guides,
    provenance,
  };
}

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameDetail>>>;

export async function getRelatedGames(
  gameId: string,
  categorySlugs: string[],
  difficulty: number | null,
  limit = 6,
): Promise<GameCard[]> {
  if (categorySlugs.length === 0) {
    return collect("", "ORDER BY g.popularity DESC", limit);
  }
  const params: SqlParam[] = [gameId, ...categorySlugs];
  const rows = await all<RawCard>(
    `${CARD_SELECT}
      WHERE g.status = 'published' AND g.id <> ?
        AND EXISTS (SELECT 1 FROM game_categories gc JOIN categories c ON c.id = gc.category_id
                     WHERE gc.game_id = g.id AND c.slug IN (${categorySlugs.map(() => "?").join(",")}))
      ORDER BY g.popularity DESC LIMIT ?`,
    [...params, limit * 3],
  );
  const cards = rows.map(mapCard);
  if (difficulty == null) return cards.slice(0, limit);
  return [...cards]
    .sort(
      (a, b) =>
        Math.abs((a.platinumDifficulty ?? 5) - difficulty) -
        Math.abs((b.platinumDifficulty ?? 5) - difficulty),
    )
    .slice(0, limit);
}

/** Comparador: devuelve los juegos en el mismo orden que los slugs. */
export async function getGamesForComparison(slugs: string[]) {
  const unique = Array.from(new Set(slugs.filter(Boolean))).slice(0, 4);
  if (unique.length === 0) return [];
  const placeholders = unique.map(() => "?").join(",");
  const rows = await all<Row & { platformsJson: string; categoriesJson: string; platformDetailsJson: string }>(
    `SELECT ${GAME_COLUMNS},
            d.name AS developerName,
            (SELECT json_group_array(json_object('slug', p.slug, 'name', p.name, 'shortName', p.short_name))
               FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id
              WHERE gp.game_id = g.id ORDER BY p.sort_order) AS platformsJson,
            (SELECT json_group_array(json_object('slug', c.slug, 'name', c.name, 'isPrimary', gc.is_primary))
               FROM game_categories gc JOIN categories c ON c.id = gc.category_id
              WHERE gc.game_id = g.id) AS categoriesJson,
            (SELECT json_group_array(json_object('slug', p.slug, 'shortName', p.short_name, 'shares', gp.shares_trophy_list, 'notes', gp.notes))
               FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id
              WHERE gp.game_id = g.id) AS platformDetailsJson
       FROM games g JOIN developers d ON d.id = g.developer_id
      WHERE g.status = 'published' AND g.slug IN (${placeholders})`,
    unique,
  );

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const out: Row[] = [];

  for (const slug of unique) {
    const g = bySlug.get(slug);
    if (!g) continue;
    const times = await all<Row>(
      `SELECT ${TIME_COLUMNS} FROM game_times WHERE game_id = ? ORDER BY sort_order`,
      [g.id],
    );
    const difficulties = await all<Row>(
      `SELECT ${DIFFICULTY_COLUMNS} FROM difficulty_ratings WHERE game_id = ? ORDER BY sort_order`,
      [g.id],
    );
    const profile =
      (await one<Row>(`SELECT ${PROFILE_COLUMNS} FROM platinum_profiles WHERE game_id = ?`, [g.id])) ??
      null;
    const lists = await all<Row>(
      `SELECT id, game_id AS gameId, platform_id AS platformId, name, is_shared AS isShared,
              is_default AS isDefault, total_count AS totalCount, completeness, notes
         FROM trophy_lists WHERE game_id = ? ORDER BY is_default DESC`,
      [g.id],
    );
    for (const l of lists) {
      l.trophies = await all<Row>(
        `SELECT t.type AS type, t.name AS name, gt.is_missable AS isMissable,
                gt.is_online AS isOnline, gt.difficulty AS difficulty
           FROM game_trophies gt JOIN trophies t ON t.id = gt.trophy_id
          WHERE gt.trophy_list_id = ?`,
        [l.id],
      );
    }
    out.push({
      ...g,
      platforms: g.platformsJson ? JSON.parse(g.platformsJson) : [],
      platformDetails: g.platformDetailsJson ? JSON.parse(g.platformDetailsJson) : [],
      categories: g.categoriesJson ? JSON.parse(g.categoriesJson) : [],
      times,
      difficulties,
      profile,
      trophyLists: lists,
    });
  }
  return out;
}

/** Sugerencias para el buscador "mientras se escribe". */
export async function searchGamesSuggest(query: string, limit = 8) {
  const terms = buildQueryTerms(query);
  if (terms.length === 0) return [];
  const conds = terms.map(() => "g.search_text LIKE ?");
  const params: SqlParam[] = terms.map((t) => `%${t}%`);
  const rows = await all<Row>(
    `SELECT g.id, g.slug, g.title, g.cover_image AS coverImage, g.accent_color AS accentColor,
            g.release_date AS releaseDate,
            d.name AS developerName,
            (SELECT json_group_array(json_object('slug', p.slug, 'shortName', p.short_name))
               FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id WHERE gp.game_id = g.id) AS platformsJson,
            (SELECT dr.score FROM difficulty_ratings dr
              WHERE dr.game_id = g.id AND dr.kind = 'platinum' ORDER BY dr.sort_order LIMIT 1) AS platinumScore
       FROM games g JOIN developers d ON d.id = g.developer_id
      WHERE g.status = 'published' AND ${conds.join(" AND ")}
      ORDER BY g.popularity DESC LIMIT ?`,
    [...params, limit],
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    coverImage: r.coverImage,
    accentColor: r.accentColor,
    releaseDate: r.releaseDate,
    developer: { name: r.developerName },
    platforms: r.platformsJson ? JSON.parse(r.platformsJson) : [],
    difficulties: r.platinumScore != null ? [{ score: r.platinumScore }] : [],
  }));
}

/** Suma una visita al contador. No se llama durante el render de la ficha
 *  (se prerenderiza) para no escribir en la base de datos durante el build. */
export async function incrementView(gameId: string) {
  const { run } = await import("@/lib/db");
  await run("UPDATE games SET view_count = view_count + 1 WHERE id = ?", [gameId]);
}
