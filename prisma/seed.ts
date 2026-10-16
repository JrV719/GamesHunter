/**
 * Seed de GamesHunter (SQLite via node:sqlite).
 *
 * - Idempotente: se puede volver a ejecutar sin duplicar nada.
 * - Crea primero el esquema (database/schema.sql).
 * - Inserta fuentes, plataformas, categorias, desarrolladores, editores y juegos.
 *
 * Ejecutar con:  npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { GAMES } from "./seed/data/index";
import { normalize } from "./seed/data/types";
import { SOURCES } from "./seed/data/sources";
import { PLATFORMS, DEVELOPERS, PUBLISHERS, CATEGORIES } from "./seed/data/taxonomy";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const file = url.startsWith("file:") ? url.slice(5) : url;
const dbPath = path.isAbsolute(file) ? file : path.join(process.cwd(), "prisma", file);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

// --- Esquema ---------------------------------------------------------------
const schema = fs.readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");
db.exec(schema);

let counter = 0;
function newId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
const now = () => new Date().toISOString();
const iso = (d: string) => new Date(`${d}T00:00:00Z`).toISOString();

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function tx<T>(fn: () => T): T {
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// --- Fuentes ---------------------------------------------------------------
// Ojo: hay que leer el id real despues del upsert, porque si la fila ya exista
// el id generado no se inserta y una FK con el apuntaria a la nada.
for (const s of SOURCES) {
  db.prepare(
    `INSERT INTO guide_sources (id, slug, name, homepage, logo_url, usage_policy, allows_copy, notes, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, homepage = excluded.homepage,
       usage_policy = excluded.usage_policy, allows_copy = excluded.allows_copy,
       notes = excluded.notes, sort_order = excluded.sort_order`,
  ).run(newId("src"), s.slug, s.name, s.homepage, null, s.usagePolicy, s.allowsCopy ? 1 : 0, s.notes, s.sortOrder);
}
const sourceIdBySlug = new Map(
  db
    .prepare("SELECT id, slug FROM guide_sources")
    .all()
    .map((r: any) => [r.slug, r.id]),
);
console.log(`  fuentes:      ${SOURCES.length}`);

// --- Plataformas -----------------------------------------------------------
for (const p of PLATFORMS) {
  db.prepare(
    `INSERT INTO platforms (id, slug, name, short_name, sort_order)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, short_name = excluded.short_name, sort_order = excluded.sort_order`,
  ).run(newId("plat"), p.slug, p.name, p.shortName, p.sortOrder);
}
const platformIdBySlug = new Map(
  db.prepare("SELECT id, slug FROM platforms").all().map((r: any) => [r.slug, r.id]),
);
console.log(`  plataformas:  ${PLATFORMS.length}`);

// --- Desarrolladores y editores -------------------------------------------
for (const d of DEVELOPERS) {
  db.prepare(
    `INSERT INTO developers (id, slug, name, country) VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, country = excluded.country`,
  ).run(newId("dev"), d.slug, d.name, d.country);
}
const devIdBySlug = new Map(
  db.prepare("SELECT id, slug FROM developers").all().map((r: any) => [r.slug, r.id]),
);
for (const p of PUBLISHERS) {
  db.prepare(
    `INSERT INTO publishers (id, slug, name) VALUES (?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name`,
  ).run(newId("pub"), p.slug, p.name);
}
const pubIdBySlug = new Map(
  db.prepare("SELECT id, slug FROM publishers").all().map((r: any) => [r.slug, r.id]),
);
console.log(`  devs:         ${DEVELOPERS.length}`);
console.log(`  editores:     ${PUBLISHERS.length}`);

// --- Categorias ------------------------------------------------------------
for (const c of CATEGORIES) {
  db.prepare(
    `INSERT INTO categories (id, slug, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description,
       icon = excluded.icon, sort_order = excluded.sort_order`,
  ).run(newId("cat"), c.slug, c.name, c.description, c.icon, c.sortOrder);
}
const catIdBySlug = new Map(
  db.prepare("SELECT id, slug FROM categories").all().map((r: any) => [r.slug, r.id]),
);
console.log(`  categorias:   ${CATEGORIES.length}`);

// --- Juegos ----------------------------------------------------------------
let trophyCount = 0;
let guideCount = 0;
let provCount = 0;

for (const raw of GAMES) {
  const g = normalize(raw);
  const profile = g.profile as Record<string, any>;
  const listSourceId = sourceIdBySlug.get(g.trophyList.sourceSlug) ?? null;
  const profileSourceId = sourceIdBySlug.get(profile.source ?? "") ?? null;

  const searchText = [
    g.title,
    g.tagline,
    g.summary,
    g.developer,
    g.categories.map((c) => c.slug).join(" "),
    g.platforms.map((p) => p.slug).join(" "),
  ]
    .join(" | ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  tx(() => {
    const existing = db.prepare("SELECT id FROM games WHERE slug = ?").get(g.slug) as any;
    const gameId = existing?.id ?? newId("game");
    const base = [
      g.title,
      g.tagline,
      g.summary,
      g.description,
      devIdBySlug.get(g.developer),
      g.publisher ? (pubIdBySlug.get(g.publisher) ?? null) : null,
      iso(g.releaseDate),
      g.accentColor,
      g.officialUrl ?? null,
      g.coverImage ?? null,
      g.dataStatus,
      g.popularity,
      g.recommended ? 1 : 0,
      g.recommendationNote ?? null,
      searchText,
    ];
    if (existing) {
      db.prepare(
        `UPDATE games SET title = ?, tagline = ?, summary = ?, description = ?, developer_id = ?,
                publisher_id = ?, release_date = ?, accent_color = ?, official_url = ?,
                cover_image = COALESCE(?, cover_image), data_status = ?,
                popularity = ?, is_recommended = ?, recommendation_note = ?, search_text = ?,
                status = 'published',
                updated_at = ?
          WHERE id = ?`,
      ).run(...base, now(), gameId);
    } else {
      db.prepare(
        `INSERT INTO games (id, slug, title, tagline, summary, description, developer_id, publisher_id,
                release_date, accent_color, official_url, cover_image, data_status, popularity,
                is_recommended, recommendation_note, search_text, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
      ).run(gameId, g.slug, ...base, now(), now());
    }

    // Plataformas y lanzamientos
    for (const p of g.platforms) {
      const platformId = platformIdBySlug.get(p.slug);
      if (!platformId) continue;
      db.prepare(
        `INSERT INTO game_platforms (id, game_id, platform_id, shares_trophy_list, notes)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(game_id, platform_id) DO UPDATE SET shares_trophy_list = excluded.shares_trophy_list,
                notes = excluded.notes`,
      ).run(newId("gp"), gameId, platformId, p.sharesTrophyList ? 1 : 0, p.notes ?? null);
      if (p.releaseDate) {
        db.prepare(
          `INSERT INTO game_releases (id, game_id, platform_id, release_date, is_original)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(game_id, platform_id) DO UPDATE SET release_date = excluded.release_date,
                  is_original = excluded.is_original`,
        ).run(newId("rel"), gameId, platformId, iso(p.releaseDate), p.isOriginal ? 1 : 0);
      }
    }

    // Categorías
    for (const c of g.categories) {
      const categoryId = catIdBySlug.get(c.slug);
      if (!categoryId) continue;
      db.prepare(
        `INSERT INTO game_categories (game_id, category_id, is_primary) VALUES (?, ?, ?)
         ON CONFLICT(game_id, category_id) DO UPDATE SET is_primary = excluded.is_primary`,
      ).run(gameId, categoryId, c.primary ? 1 : 0);
    }

    // Tiempos
    db.prepare("DELETE FROM game_times WHERE game_id = ?").run(gameId);
    g.times.forEach((t, i) => {
      db.prepare(
        `INSERT INTO game_times (id, game_id, platform_id, kind, label, min_hours, max_hours, note, sort_order, source_id)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(newId("time"), gameId, t.kind, t.label, t.min, t.max, t.note ?? null, i, listSourceId);
    });

    // Dificultades
    db.prepare("DELETE FROM difficulty_ratings WHERE game_id = ?").run(gameId);
    g.difficulties.forEach((d, i) => {
      db.prepare(
        `INSERT INTO difficulty_ratings (id, game_id, kind, label, score, note, sort_order, source_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(newId("diff"), gameId, d.kind, d.label, d.score, d.note ?? null, i, listSourceId);
    });

    // Ficha de platino
    const ppValues = [
      gameId,
      profile.total,
      1,
      profile.gold,
      profile.silver,
      profile.bronze,
      profile.hMin,
      profile.hMax,
      profile.runsMin ?? null,
      profile.runsMax ?? null,
      profile.grind ?? null,
      profile.missables ? 1 : 0,
      profile.online ? 1 : 0,
      profile.diffLinked ? 1 : 0,
      profile.maxDiff ? 1 : 0,
      profile.collectibles ? 1 : 0,
      profile.servers ? 1 : 0,
      profile.psPlus ? 1 : 0,
      profile.dlc ? 1 : 0,
      profile.afterEnding === false ? 0 : 1,
      profile.missableNote ?? null,
      profile.onlineNote ?? null,
      profile.quick,
      profileSourceId,
    ];
    db.prepare(
      `INSERT INTO platinum_profiles (
        game_id, total_trophies, platinum_count, gold_count, silver_count, bronze_count,
        estimated_hours_min, estimated_hours_max, playthroughs_min, playthroughs_max, grind_rating,
        has_missables, has_online, has_missable_online, difficulty_linked, requires_max_difficulty,
        has_collectibles, requires_active_servers, requires_ps_plus, requires_dlc, platinum_after_ending,
        missable_trophies, online_trophies, difficulty_trophies, quick_summary, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
       ON CONFLICT(game_id) DO UPDATE SET
         total_trophies = excluded.total_trophies, gold_count = excluded.gold_count,
         silver_count = excluded.silver_count, bronze_count = excluded.bronze_count,
         estimated_hours_min = excluded.estimated_hours_min,
         estimated_hours_max = excluded.estimated_hours_max,
         playthroughs_min = excluded.playthroughs_min, playthroughs_max = excluded.playthroughs_max,
         grind_rating = excluded.grind_rating, has_missables = excluded.has_missables,
         has_online = excluded.has_online, difficulty_linked = excluded.difficulty_linked,
         requires_max_difficulty = excluded.requires_max_difficulty,
         has_collectibles = excluded.has_collectibles,
         requires_active_servers = excluded.requires_active_servers,
         requires_ps_plus = excluded.requires_ps_plus, requires_dlc = excluded.requires_dlc,
         platinum_after_ending = excluded.platinum_after_ending,
         missable_trophies = excluded.missable_trophies, online_trophies = excluded.online_trophies,
         quick_summary = excluded.quick_summary, source_id = excluded.source_id`,
    ).run(...ppValues);

    // Trofeos
    db.prepare("DELETE FROM game_trophies WHERE game_id = ?").run(gameId);
    db.prepare("DELETE FROM trophy_lists WHERE game_id = ?").run(gameId);
    db.prepare("DELETE FROM trophies WHERE game_id = ?").run(gameId);

    const listId = newId("tlist");
    db.prepare(
      `INSERT INTO trophy_lists (id, game_id, platform_id, name, is_shared, is_default, total_count, completeness, notes, source_id, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
    ).run(
      listId,
      gameId,
      g.trophyList.name,
      g.trophyList.isShared ? 1 : 0,
      g.trophyList.trophies.length,
      g.trophyList.completeness,
      g.trophyList.notes ?? null,
      listSourceId,
      now(),
      now(),
    );

    g.trophyList.trophies.forEach((tr, i) => {
      const trophyId = newId("trophy");
      db.prepare(
        `INSERT INTO trophies (id, slug, name, type, icon_url, official_description, game_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
      ).run(
        trophyId,
        `${g.slug}--${slugify(tr.name)}`,
        tr.name,
        tr.type,
        tr.description ?? null,
        gameId,
        now(),
        now(),
      );
      db.prepare(
        `INSERT INTO game_trophies (id, game_id, trophy_list_id, trophy_id, sort_order, how_to, difficulty,
                is_missable, is_online, recommended_stage, requires_difficulty, is_dlc, is_unobtainable, note, source_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
      ).run(
        newId("gt"),
        gameId,
        listId,
        trophyId,
        i,
        tr.howTo,
        tr.difficulty,
        tr.isMissable ? 1 : 0,
        tr.isOnline ? 1 : 0,
        tr.recommendedStage,
        tr.requiresDifficulty ?? null,
        tr.isDLC ? 1 : 0,
        listSourceId,
      );
    });

    // Guía
    const guideSlug = `platino-${g.slug}`;
    const steps = g.guide.steps.map((s, i) => ({
      stepNumber: i + 1,
      title: s.title,
      body: s.body,
      warning: s.warning ?? null,
    }));
    const body = buildGuideBody(g, steps, g.trophyList.trophies.length);
    const guideId = newId("guide");
    db.prepare(
      `INSERT INTO guides (id, slug, game_id, kind, title, summary, body, status, data_status,
              is_community, author_id, reading_time, view_count, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, 0, NULL, ?, 0, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET game_id = excluded.game_id, kind = excluded.kind,
         title = excluded.title, summary = excluded.summary, body = excluded.body,
         status = 'published', data_status = excluded.data_status, reading_time = excluded.reading_time,
         published_at = excluded.published_at, updated_at = excluded.updated_at`,
    ).run(
      guideId,
      guideSlug,
      gameId,
      g.guide.kind,
      g.guide.title,
      g.guide.summary,
      body,
      g.dataStatus,
      Math.max(3, Math.round(body.split(/\s+/).length / 200)),
      now(),
      now(),
      now(),
    );
    const realGuideId = (
      db.prepare("SELECT id FROM guides WHERE slug = ?").get(guideSlug) as any
    ).id;

    db.prepare("DELETE FROM guide_steps WHERE guide_id = ?").run(realGuideId);
    steps.forEach((s, i) => {
      db.prepare(
        `INSERT INTO guide_steps (id, guide_id, step_number, title, body, warning, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(newId("gstep"), realGuideId, s.stepNumber, s.title, s.body, s.warning, i);
    });

    db.prepare("DELETE FROM guide_source_refs WHERE guide_id = ?").run(realGuideId);
    for (const src of g.dataSources) {
      const sourceId = sourceIdBySlug.get(src.slug);
      if (!sourceId) continue;
      db.prepare(
        `INSERT INTO guide_source_refs (id, guide_id, source_id, url, last_updated, confidence, scope, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      ).run(newId("gsref"), realGuideId, sourceId, src.url, now(), src.confidence, src.scope);
    }

    // Trazabilidad
    db.prepare(
      "DELETE FROM data_provenance WHERE entity_type = 'game' AND entity_id = ?",
    ).run(gameId);
    for (const src of g.dataSources) {
      const sourceId = sourceIdBySlug.get(src.slug);
      if (!sourceId) continue;
      db.prepare(
        `INSERT INTO data_provenance (id, entity_type, entity_id, field, source_id, source_url,
                last_updated, confidence, data_status, note, reviewed_by_id, created_at)
         VALUES (?, 'game', ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      ).run(newId("prov"), gameId, src.scope, sourceId, src.url, now(), src.confidence, g.dataStatus, now());
      provCount += 1;
    }

    guideCount += 1;
    trophyCount += g.trophyList.trophies.length;
  });

  console.log(`  · ${g.title}`);
}

// --- Temas del foro ---------------------------------------------------------
// Son contenido de la aplicación, no datos editoriales: se siembran siempre,
// incluso con SEED_DEMO_DATA=false, para que la comunidad arranque usable.
const TOPICS = [
  {
    slug: "platinos",
    name: "Platinos",
    description: "Cómo se sacan los platinos: rutas, tiempos y estrategias.",
    accent: "#7dd3fc",
    sortOrder: 10,
  },
  {
    slug: "trofeos",
    name: "Trofeos",
    description: "Dudas y métodos sobre trofeos concretos.",
    accent: "#fbbf24",
    sortOrder: 20,
  },
  {
    slug: "dificultad-y-tiempos",
    name: "Dificultad y tiempos",
    description: "Cuánto cuesta cada platino y qué dificultad tiene de verdad.",
    accent: "#fb7185",
    sortOrder: 30,
  },
  {
    slug: "consejos",
    name: "Consejos",
    description: "Trucos, rutas y atajos que ahorran horas.",
    accent: "#34d399",
    sortOrder: 40,
  },
  {
    slug: "online-y-cooperativo",
    name: "Online y cooperativo",
    description: "Trofeos con conexión, servidores y juego cooperativo.",
    accent: "#a78bfa",
    sortOrder: 50,
  },
  {
    slug: "noticias",
    name: "Noticias",
    description: "Novedades de la plataforma y de los juegos catalogados.",
    accent: "#38bdf8",
    sortOrder: 60,
  },
  {
    slug: "general",
    name: "General",
    description: "Cualquier otro tema relacionado con los juegos.",
    accent: "#8fa0ba",
    sortOrder: 70,
  },
];
for (const t of TOPICS) {
  db.prepare(
    `INSERT INTO topics (id, slug, name, description, accent, sort_order, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description,
       accent = excluded.accent, sort_order = excluded.sort_order, is_active = 1`,
  ).run(newId("topic"), t.slug, t.name, t.description, t.accent, t.sortOrder, now());
}
const topicIdBySlug = new Map(
  db.prepare("SELECT id, slug FROM topics").all().map((r: any) => [r.slug, r.id]),
);

// --- Usuario administrador -------------------------------------------------
const email = (process.env.ADMIN_EMAIL ?? "admin@gameshunter.app").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "gameshunter";
const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
const passwordHash = bcrypt.hashSync(password, 10);
const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
if (existingUser) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin', username = ?, updated_at = ? WHERE id = ?").run(
    passwordHash,
    username,
    now(),
    existingUser.id,
  );
} else {
  db.prepare(
    `INSERT INTO users (id, email, username, display_name, password_hash, role, status, locale, created_at, updated_at)
     VALUES (?, ?, ?, 'Administrador', ?, 'admin', 'active', 'es', ?, ?)`,
  ).run(newId("user"), email, username, passwordHash, now(), now());
}

console.log(`  juegos:       ${GAMES.length}`);
console.log(`  guias:        ${guideCount}`);
console.log(`  trofeos:      ${trophyCount}`);
console.log(`  procedencia:  ${provCount} registros`);
console.log(`  temas foro:   ${topicIdBySlug.size}`);
console.log(`\n  Admin: ${email} / ${password}`);
console.log("  Listo.\n");
db.close();

function buildGuideBody(
  g: ReturnType<typeof normalize>,
  steps: { stepNumber: number; title: string; body: string; warning: string | null }[],
  documented: number,
): string {
  const lines: string[] = [];
  lines.push(g.guide.summary);
  lines.push("");
  lines.push(
    "Esta guía está escrita con nuestro propio lenguaje a partir de la bibliografía sobre el juego.",
  );
  lines.push(
    "No reproduce ningún texto de la fuente original: resume la información y enlaza a la fuente",
  );
  lines.push("para que puedas consultarla.");
  lines.push("");
  lines.push("## Antes de empezar");
  lines.push("");
  lines.push(
    "- Los tiempos son orientativos: un jugador que conoce la historia avanza más rápido que alguien que la disfruta por primera vez.",
  );
  lines.push(
    "- Si el juego tiene trofeos perdibles, decide la estrategia antes de empezar. Volver atrás no siempre es posible.",
  );
  lines.push("");
  lines.push("## Pasos");
  lines.push("");
  for (const s of steps) {
    lines.push(`### Paso ${s.stepNumber} — ${s.title}`);
    lines.push("");
    lines.push(s.body);
    if (s.warning) {
      lines.push("");
      lines.push(`> ⚠ ${s.warning}`);
    }
    lines.push("");
  }
  lines.push("## Nota sobre los datos");
  lines.push("");
  lines.push(
    `De los ${documented} trofeos documentados en esta ficha, consulta cada uno con su dificultad estimada,`,
  );
  lines.push(
    "sus avisos de perdible u online y el momento recomendado para conseguirlo.",
  );
  lines.push("");
  lines.push(
    "Cada dato de esta ficha indica su fuente y su nivel de confianza en la sección de datos. Si algo no cuadra,",
  );
  lines.push("consulta siempre el enlace a la fuente original.");
  return lines.join("\n");
}
