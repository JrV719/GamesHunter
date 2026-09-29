import "server-only";
import { all, one, run, type SqlParam } from "@/lib/db";
import type { Row } from "@/lib/db-types";
import { slugify } from "@/lib/utils";

// ============================================================================
// Guías
// ============================================================================

const GUIDE_WITH_GAME = `
  SELECT gu.*, g.slug AS gameSlug, g.title AS gameTitle, g.cover_image AS gameCoverImage,
         g.accent_color AS gameAccentColor,
         u.username AS authorUsername, u.display_name AS authorDisplayName
    FROM guides gu
    LEFT JOIN games g ON g.id = gu.game_id
    LEFT JOIN users u ON u.id = gu.author_id
`;

export async function listGuides(opts: { gameId?: string; limit?: number; page?: number } = {}) {
  const pageSize = opts.limit ?? 12;
  const page = Math.max(1, opts.page ?? 1);
  const conds = ["gu.status = 'published'"];
  const params: SqlParam[] = [];
  if (opts.gameId) {
    conds.push("gu.game_id = ?");
    params.push(opts.gameId);
  }
  const where = ` WHERE ${conds.join(" AND ")}`;

  const total = one<{ n: number }>(`SELECT COUNT(*) AS n FROM guides gu${where}`, params)?.n ?? 0;
  const guides = all<Row>(
    `${GUIDE_WITH_GAME}${where} ORDER BY gu.published_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );

  for (const g of guides) {
    g.stepCount = one<{ n: number }>("SELECT COUNT(*) AS n FROM guide_steps WHERE guide_id = ?", [
      g.id,
    ])?.n;
    g.sources = all<Row>(
      `SELECT gs.name AS sourceName, gs.slug AS sourceSlug, gsr.url, gsr.scope, gsr.confidence
         FROM guide_source_refs gsr JOIN guide_sources gs ON gs.id = gsr.source_id
        WHERE gsr.guide_id = ?`,
      [g.id],
    );
  }

  return { guides, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getGuideBySlug(slug: string): Promise<Row | null> {
  const guide = one<Row>(`${GUIDE_WITH_GAME} WHERE gu.slug = ? AND gu.status = 'published'`, [slug]);
  if (!guide) return null;
  guide.steps = all<Row>(
    `SELECT id, guide_id AS guideId, step_number AS stepNumber, title, body, warning, sort_order AS sortOrder FROM guide_steps WHERE guide_id = ? ORDER BY step_number`,
    [guide.id],
  );
  guide.sources = all<Row>(
    `SELECT gsr.*, gs.name AS sourceName, gs.slug AS sourceSlug, gs.homepage AS sourceHomepage,
            gs.usage_policy AS usagePolicy, gs.notes AS sourceNotes
       FROM guide_source_refs gsr JOIN guide_sources gs ON gs.id = gsr.source_id
      WHERE gsr.guide_id = ?`,
    [guide.id],
  );
  return guide;
}

export async function getGuideById(id: string): Promise<Row | null> {
  const guide = one<Row>(`${GUIDE_WITH_GAME} WHERE gu.id = ?`, [id]);
  if (!guide) return null;
  guide.steps = all<Row>(`SELECT id, guide_id AS guideId, step_number AS stepNumber, title, body, warning, sort_order AS sortOrder FROM guide_steps WHERE guide_id = ? ORDER BY step_number`, [
    guide.id,
  ]);
  guide.sources = all<Row>(
    `SELECT gsr.*, gs.name AS sourceName, gs.slug AS sourceSlug
       FROM guide_source_refs gsr JOIN guide_sources gs ON gs.id = gsr.source_id
      WHERE gsr.guide_id = ?`,
    [guide.id],
  );
  return guide;
}

export async function createGuide(input: {
  gameId?: string | null;
  kind: string;
  title: string;
  summary: string;
  body: string;
  status?: string;
  isCommunity?: boolean;
  authorId?: string | null;
  dataStatus?: string;
  steps?: { title: string; body: string; warning?: string | null }[];
  sourceRefs?: { sourceId: string; url: string; scope?: string; confidence?: string }[];
}): Promise<Row> {
  const slug = await uniqueGuideSlug(input.title);
  const { lastInsertRowid } = run(
    `INSERT INTO guides (id, slug, game_id, kind, title, summary, body, status, data_status,
                          is_community, author_id, reading_time, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("guide"),
      slug,
      input.gameId ?? null,
      input.kind,
      input.title,
      input.summary,
      input.body,
      input.status ?? "published",
      input.dataStatus ?? "provisional",
      input.isCommunity ?? false,
      input.authorId ?? null,
      Math.max(2, Math.round(input.body.split(/\s+/).length / 200)),
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );
  const id = String(lastInsertRowid);
  for (const [i, s] of (input.steps ?? []).entries()) {
    run(
      `INSERT INTO guide_steps (id, guide_id, step_number, title, body, warning, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId("gstep"), id, i + 1, s.title, s.body, s.warning ?? null, i],
    );
  }
  for (const s of input.sourceRefs ?? []) {
    run(
      `INSERT INTO guide_source_refs (id, guide_id, source_id, url, scope, confidence, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId("gsref"), id, s.sourceId, s.url, s.scope ?? null, s.confidence ?? "media", new Date().toISOString()],
    );
  }
  return (await getGuideById(id))!;
}

export async function updateGuide(
  id: string,
  input: { title?: string; summary?: string; body?: string; kind?: string; status?: string; dataStatus?: string },
) {
  const fields: string[] = [];
  const params: SqlParam[] = [];
  for (const [k, col] of [
    ["title", "title"],
    ["summary", "summary"],
    ["body", "body"],
    ["kind", "kind"],
    ["status", "status"],
    ["dataStatus", "data_status"],
  ] as const) {
    if (input[k] != null) {
      fields.push(`${col} = ?`);
      params.push(input[k] as string);
    }
  }
  if (fields.length === 0) return;
  fields.push("updated_at = ?");
  params.push(new Date().toISOString(), id);
  run(`UPDATE guides SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function replaceGuideSteps(
  guideId: string,
  steps: { title: string; body: string; warning?: string | null }[],
) {
  run("DELETE FROM guide_steps WHERE guide_id = ?", [guideId]);
  for (const [i, s] of steps.entries()) {
    run(
      `INSERT INTO guide_steps (id, guide_id, step_number, title, body, warning, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId("gstep"), guideId, i + 1, s.title, s.body, s.warning ?? null, i],
    );
  }
  run("UPDATE guides SET updated_at = ? WHERE id = ?", [new Date().toISOString(), guideId]);
}

export async function deleteGuide(id: string) {
  run("DELETE FROM guides WHERE id = ?", [id]);
}

export async function uniqueGuideSlug(title: string): Promise<string> {
  const root = slugify(title) || "sin-titulo";
  let candidate = root;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = one<{ id: string }>("SELECT id FROM guides WHERE slug = ?", [candidate]);
    if (!exists) return candidate;
    candidate = `${root}-${i++}`;
  }
}

/** Genera un id tipo cuid sin dependencias. */
export function newId(prefix = "id"): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  const rand2 = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${time}${rand}${rand2}`;
}
