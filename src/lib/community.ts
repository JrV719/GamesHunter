import "server-only";
import { all, one, run, type SqlParam } from "@/lib/db";
import { newId } from "@/lib/queries/guides";
import {
  COMMUNITY_LIMITS,
  type PostKind,
  type PostSort,
} from "@/lib/constants";

// ============================================================================
// Comunidad: foro, opiniones y comentarios
// ----------------------------------------------------------------------------
// Todas las funciones reciben ya el id del usuario que actúa y devuelven
// errores de dominio como `CommunityError`. Quién puede llamar a cada una lo
// decide @/lib/permissions; aquí solo se validan los datos de entrada.
// ============================================================================

export class CommunityError extends Error {}

export type PostRow = {
  id: string;
  userId: string;
  gameId: string | null;
  topicId: string | null;
  kind: string;
  title: string;
  body: string;
  status: string;
  isPinned: boolean;
  commentsCount: number;
  viewsCount: number;
  votesCount: number;
  ratingDifficulty: number | null;
  ratingHours: number | null;
  ratingOverall: number | null;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  lastActivityAt: string;
  // Autor y contexto (join)
  username: string;
  displayName: string | null;
  authorRole: string;
  gameSlug: string | null;
  gameTitle: string | null;
  gameAccentColor: string | null;
  topicSlug: string | null;
  topicName: string | null;
  votedByMe: number;
};

export type CommentRow = {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  body: string;
  status: string;
  depth: number;
  votesCount: number;
  moderationNote: string | null;
  createdAt: string;
  editedAt: string | null;
  username: string;
  displayName: string | null;
  authorRole: string;
  votedByMe: number;
};

export type TopicRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  accent: string;
  sortOrder: number;
  isActive: boolean;
  postCount?: number;
};

const POST_SELECT = `
  SELECT p.id, p.user_id AS userId, p.game_id AS gameId, p.topic_id AS topicId, p.kind,
         p.title, p.body, p.status, p.is_pinned AS isPinned, p.comments_count AS commentsCount,
         p.views_count AS viewsCount, p.votes_count AS votesCount,
         p.rating_difficulty AS ratingDifficulty, p.rating_hours AS ratingHours,
         p.rating_overall AS ratingOverall, p.moderation_note AS moderationNote,
         p.created_at AS createdAt, p.updated_at AS updatedAt, p.edited_at AS editedAt,
         p.last_activity_at AS lastActivityAt,
         u.username, u.display_name AS displayName, u.role AS authorRole,
         g.slug AS gameSlug, g.title AS gameTitle, g.accent_color AS gameAccentColor,
         t.slug AS topicSlug, t.name AS topicName,
         (SELECT COUNT(*) FROM post_votes pv WHERE pv.post_id = p.id AND pv.user_id = ?) AS votedByMe
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN games g ON g.id = p.game_id
    LEFT JOIN topics t ON t.id = p.topic_id
`;

const COMMENT_SELECT = `
  SELECT c.id, c.post_id AS postId, c.user_id AS userId, c.parent_id AS parentId, c.body,
         c.status, c.depth, c.votes_count AS votesCount, c.moderation_note AS moderationNote,
         c.created_at AS createdAt, c.edited_at AS editedAt,
         u.username, u.display_name AS displayName, u.role AS authorRole,
         (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.user_id = ?) AS votedByMe
    FROM comments c
    JOIN users u ON u.id = c.user_id
`;

/**
 * Un moderador ve también lo oculto; el resto del público, solo lo publicado.
 * La visibilidad se resuelve siempre dentro de `conds`, nunca inyectando un
 * AND en el JOIN (eso filtraría la tabla unida, no las filas).
 */
function visibilityClause(viewerIsStaff: boolean): string {
  return viewerIsStaff ? "" : " AND p.status = 'published'";
}

function now() {
  return new Date().toISOString();
}

// ----------------------------------------------------------------------------
// Temas
// ----------------------------------------------------------------------------

export async function listTopics(onlyActive = true): Promise<TopicRow[]> {
  const rows = await all<TopicRow>(
    `SELECT t.id, t.slug, t.name, t.description, t.icon, t.accent,
            t.sort_order AS sortOrder, t.is_active AS isActive,
            (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id AND p.status = 'published') AS postCount
       FROM topics t
      ${onlyActive ? "WHERE t.is_active = 1" : ""}
      ORDER BY t.sort_order, t.name`,
  );
  return rows;
}

export async function getTopicBySlug(slug: string): Promise<TopicRow | null> {
  return one<TopicRow>(
    `SELECT id, slug, name, description, icon, accent, sort_order AS sortOrder, is_active AS isActive
       FROM topics WHERE slug = ?`,
    [slug],
  );
}

// ----------------------------------------------------------------------------
// Publicaciones
// ----------------------------------------------------------------------------

export type ListPostsOpts = {
  q?: string;
  topic?: string;
  game?: string;
  kind?: PostKind;
  userId?: string;
  sort?: PostSort;
  page?: number;
  pageSize?: number;
  viewerIsStaff?: boolean;
  viewerId?: string | null;
  includeHidden?: boolean;
};

export async function listPosts(opts: ListPostsOpts = {}) {
  const {
    q,
    topic,
    game,
    kind,
    userId,
    sort = "recientes",
    page = 1,
    pageSize = 12,
    viewerIsStaff = false,
    viewerId = null,
    includeHidden = false,
  } = opts;

  const conds: string[] = [];
  const params: SqlParam[] = [];

  // El staff ve todos los estados; el resto solo lo publicado.
  if (!(viewerIsStaff && includeHidden)) {
    conds.push("p.status = 'published'");
  }

  if (topic) {
    conds.push("t.slug = ?");
    params.push(topic);
  }
  if (game) {
    conds.push("g.slug = ?");
    params.push(game);
  }
  if (kind) {
    conds.push("p.kind = ?");
    params.push(kind);
  }
  if (userId) {
    conds.push("p.user_id = ?");
    params.push(userId);
  }
  if (q?.trim()) {
    // Búsqueda simple sobre título y cuerpo. SQLite no trae FTS5 en node:sqlite
    // de forma fiable, así que se filtra en SQL con LIKE y texto normalizado.
    const term = q.trim().toLowerCase();
    conds.push("(LOWER(p.title) LIKE ? OR LOWER(p.body) LIKE ?)");
    params.push(`%${term}%`, `%${term}%`);
  }

  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";

  const countRow = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts p
       LEFT JOIN games g ON g.id = p.game_id
       LEFT JOIN topics t ON t.id = p.topic_id${where}`,
    params,
  );

  const order =
    sort === "populares"
      ? "ORDER BY p.votes_count DESC, p.created_at DESC"
      : sort === "comentados"
        ? "ORDER BY p.comments_count DESC, p.created_at DESC"
        : sort === "sin-respuesta"
          ? "ORDER BY p.comments_count ASC, p.created_at DESC"
          : "ORDER BY p.created_at DESC";

  const rows = await all<PostRow>(
    `${POST_SELECT} ${where} ${order} LIMIT ? OFFSET ?`,
    [viewerId ?? "", ...params, pageSize, (Math.max(1, page) - 1) * pageSize],
  );

  const total = countRow?.n ?? 0;
  return {
    posts: rows,
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPostById(
  id: string,
  opts: { viewerId?: string | null; viewerIsStaff?: boolean } = {},
): Promise<PostRow | null> {
  const row = await one<PostRow>(
    `${POST_SELECT} WHERE p.id = ?${visibilityClause(!!opts.viewerIsStaff)}`,
    [opts.viewerId ?? "", id],
  );
  return row;
}

export async function getCommentsForPost(
  postId: string,
  opts: { viewerId?: string | null; viewerIsStaff?: boolean } = {},
): Promise<CommentRow[]> {
  return all<CommentRow>(
    `${COMMENT_SELECT}
      WHERE c.post_id = ?${opts.viewerIsStaff ? "" : " AND c.status = 'published'"}
      ORDER BY c.created_at ASC`,
    [opts.viewerId ?? "", postId],
  );
}

export async function getRelatedPosts(postId: string, gameId: string | null, limit = 3) {
  if (!gameId) return [];
  return all<PostRow>(
    `${POST_SELECT}
      WHERE p.game_id = ? AND p.id <> ? AND p.status = 'published'
      ORDER BY p.created_at DESC LIMIT ?`,
    ["", gameId, postId, limit],
  );
}

function validatePost(input: {
  title: string;
  body: string;
  kind: string;
  topicId?: string | null;
  gameId?: string | null;
  ratingDifficulty?: number | null;
  ratingHours?: number | null;
  ratingOverall?: number | null;
}) {
  const title = input.title.trim();
  const body = input.body.trim();

  if (title.length < COMMUNITY_LIMITS.postTitleMin) {
    throw new CommunityError(
      `El título necesita al menos ${COMMUNITY_LIMITS.postTitleMin} caracteres.`,
    );
  }
  if (title.length > COMMUNITY_LIMITS.postTitleMax) {
    throw new CommunityError(`El título no puede pasar de ${COMMUNITY_LIMITS.postTitleMax} caracteres.`);
  }
  if (body.length < COMMUNITY_LIMITS.postBodyMin) {
    throw new CommunityError(`El texto necesita al menos ${COMMUNITY_LIMITS.postBodyMin} caracteres.`);
  }
  if (body.length > COMMUNITY_LIMITS.postBodyMax) {
    throw new CommunityError(`El texto no puede pasar de ${COMMUNITY_LIMITS.postBodyMax} caracteres.`);
  }
  return { title, body };
}

function clampRating(value: number | null | undefined, min: number, max: number) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export async function createPost(input: {
  userId: string;
  title: string;
  body: string;
  kind?: string;
  topicId?: string | null;
  gameId?: string | null;
  ratingDifficulty?: number | null;
  ratingHours?: number | null;
  ratingOverall?: number | null;
}): Promise<string> {
  const kind = input.kind ?? "post";
  const { title, body } = validatePost({ ...input, kind });

  // El juego y el tema deben existir de verdad: se validan contra la BD.
  if (input.gameId) {
    const game = await one<{ id: string }>("SELECT id FROM games WHERE id = ?", [input.gameId]);
    if (!game) throw new CommunityError("El juego indicado no existe.");
  }
  if (input.topicId) {
    const topic = await one<{ id: string }>("SELECT id FROM topics WHERE id = ?", [input.topicId]);
    if (!topic) throw new CommunityError("El tema indicado no existe.");
  }

  const id = newId("post");
  const ts = now();
  await run(
    `INSERT INTO posts (id, user_id, game_id, topic_id, kind, title, body, status,
                        rating_difficulty, rating_hours, rating_overall,
                        created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.gameId ?? null,
      input.topicId ?? null,
      kind,
      title,
      body,
      clampRating(input.ratingDifficulty, 1, 10),
      input.ratingHours != null && Number.isFinite(input.ratingHours) ? input.ratingHours : null,
      clampRating(input.ratingOverall, 1, 10),
      ts,
      ts,
      ts,
    ],
  );
  await logActivity(input.userId, "post.created", "post", id, `Publicación creada: ${title}`);
  return id;
}

export async function updatePost(input: {
  id: string;
  title: string;
  body: string;
  topicId?: string | null;
  gameId?: string | null;
  ratingDifficulty?: number | null;
  ratingHours?: number | null;
  ratingOverall?: number | null;
}): Promise<void> {
  const { title, body } = validatePost({ ...input, kind: "post" });
  await run(
    `UPDATE posts SET title = ?, body = ?, topic_id = ?, game_id = ?,
            rating_difficulty = ?, rating_hours = ?, rating_overall = ?,
            updated_at = ?, edited_at = ?
      WHERE id = ?`,
    [
      title,
      body,
      input.topicId ?? null,
      input.gameId ?? null,
      clampRating(input.ratingDifficulty, 1, 10),
      input.ratingHours != null && Number.isFinite(input.ratingHours) ? input.ratingHours : null,
      clampRating(input.ratingOverall, 1, 10),
      now(),
      now(),
      input.id,
    ],
  );
}

/** Borrado lógico: el contenido se oculta en vez de desaparecer. */
export async function deletePost(id: string): Promise<void> {
  await run(
    "UPDATE posts SET status = 'hidden', moderation_note = 'Eliminado', updated_at = ? WHERE id = ?",
    [now(), id],
  );
}

export async function setPostStatus(id: string, status: string, note?: string | null) {
  await run("UPDATE posts SET status = ?, moderation_note = ?, updated_at = ? WHERE id = ?", [
    status,
    note ?? null,
    now(),
    id,
  ]);
}

export async function setPostPinned(id: string, pinned: boolean) {
  await run("UPDATE posts SET is_pinned = ? WHERE id = ?", [pinned ? 1 : 0, id]);
}

export async function incrementPostViews(id: string) {
  await run("UPDATE posts SET views_count = views_count + 1 WHERE id = ?", [id]);
}

// ----------------------------------------------------------------------------
// Votos
// ----------------------------------------------------------------------------

export async function togglePostVote(postId: string, userId: string): Promise<boolean> {
  const existing = await one<{ post_id: string }>(
    "SELECT post_id FROM post_votes WHERE post_id = ? AND user_id = ?",
    [postId, userId],
  );
  if (existing) {
    await run("DELETE FROM post_votes WHERE post_id = ? AND user_id = ?", [postId, userId]);
    await run("UPDATE posts SET votes_count = MAX(0, votes_count - 1) WHERE id = ?", [postId]);
    return false;
  }
  await run("INSERT INTO post_votes (post_id, user_id, created_at) VALUES (?, ?, ?)", [
    postId,
    userId,
    now(),
  ]);
  await run("UPDATE posts SET votes_count = votes_count + 1 WHERE id = ?", [postId]);
  return true;
}

export async function toggleCommentVote(commentId: string, userId: string): Promise<boolean> {
  const existing = await one<{ comment_id: string }>(
    "SELECT comment_id FROM comment_votes WHERE comment_id = ? AND user_id = ?",
    [commentId, userId],
  );
  if (existing) {
    await run("DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?", [
      commentId,
      userId,
    ]);
    await run("UPDATE comments SET votes_count = MAX(0, votes_count - 1) WHERE id = ?", [commentId]);
    return false;
  }
  await run("INSERT INTO comment_votes (comment_id, user_id, created_at) VALUES (?, ?, ?)", [
    commentId,
    userId,
    now(),
  ]);
  await run("UPDATE comments SET votes_count = votes_count + 1 WHERE id = ?", [commentId]);
  return true;
}

// ----------------------------------------------------------------------------
// Comentarios
// ----------------------------------------------------------------------------

export async function createComment(input: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}): Promise<string> {
  const body = input.body.trim();
  if (body.length < COMMUNITY_LIMITS.commentMin) {
    throw new CommunityError(
      `El comentario necesita al menos ${COMMUNITY_LIMITS.commentMin} caracteres.`,
    );
  }
  if (body.length > COMMUNITY_LIMITS.commentMax) {
    throw new CommunityError(
      `El comentario no puede pasar de ${COMMUNITY_LIMITS.commentMax} caracteres.`,
    );
  }

  const post = await one<{ id: string; title: string; status: string }>(
    "SELECT id, title, status FROM posts WHERE id = ?",
    [input.postId],
  );
  if (!post) throw new CommunityError("La publicación ya no existe.");
  if (post.status !== "published") throw new CommunityError("No se puede comentar esta publicación.");

  // Solo se admite un nivel de anidado. Si se responde a una respuesta, la
  // nueva se cuelga del comentario raíz para que el hilo no crezca sin fin.
  let parentId: string | null = null;
  let depth = 0;
  if (input.parentId) {
    const parent = await one<{ id: string; depth: number; parent_id: string | null }>(
      "SELECT id, depth, parent_id FROM comments WHERE id = ? AND post_id = ?",
      [input.parentId, input.postId],
    );
    if (parent) {
      depth = 1;
      parentId = parent.depth >= 1 ? parent.parent_id : parent.id;
    }
  }

  const id = newId("cmt");
  const ts = now();
  await run(
    `INSERT INTO comments (id, post_id, user_id, parent_id, body, status, depth, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
    [id, input.postId, input.userId, parentId, body, depth, ts, ts],
  );
  await refreshCommentCount(input.postId);
  await run("UPDATE posts SET last_activity_at = ? WHERE id = ?", [ts, input.postId]);
  await logActivity(input.userId, "comment.created", "comment", id, `Comentario en: ${post.title}`);
  return id;
}

export async function updateComment(id: string, body: string): Promise<void> {
  const clean = body.trim();
  if (clean.length < COMMUNITY_LIMITS.commentMin) {
    throw new CommunityError("El comentario es demasiado corto.");
  }
  if (clean.length > COMMUNITY_LIMITS.commentMax) {
    throw new CommunityError("El comentario es demasiado largo.");
  }
  await run("UPDATE comments SET body = ?, updated_at = ?, edited_at = ? WHERE id = ?", [
    clean,
    now(),
    now(),
    id,
  ]);
}

export async function deleteComment(id: string): Promise<string | null> {
  const comment = await one<{ post_id: string }>("SELECT post_id FROM comments WHERE id = ?", [id]);
  if (!comment) return null;
  await run("UPDATE comments SET status = 'hidden', moderation_note = 'Eliminado' WHERE id = ?", [id]);
  await refreshCommentCount(comment.post_id);
  return comment.post_id;
}

export async function setCommentStatus(id: string, status: string, note?: string | null) {
  await run("UPDATE comments SET status = ?, moderation_note = ? WHERE id = ?", [
    status,
    note ?? null,
    id,
  ]);
  const comment = await one<{ post_id: string }>("SELECT post_id FROM comments WHERE id = ?", [id]);
  if (comment) await refreshCommentCount(comment.post_id);
}

/** Recalcula el contador de comentarios visibles de una publicación. */
export async function refreshCommentCount(postId: string) {
  await run(
    "UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND status = 'published') WHERE id = ?",
    [postId, postId],
  );
}

// ----------------------------------------------------------------------------
// Denuncias
// ----------------------------------------------------------------------------

export async function createReport(input: {
  reporterId: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  details?: string | null;
}) {
  // Un mismo usuario no denuncia dos veces lo mismo.
  const existing = await one<{ id: string }>(
    `SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'`,
    [input.reporterId, input.targetType, input.targetId],
  );
  if (existing) throw new CommunityError("Ya has denunciado este contenido.");

  await run(
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
    [
      newId("rep"),
      input.reporterId,
      input.targetType,
      input.targetId,
      input.reason,
      input.details?.trim() || null,
      now(),
    ],
  );
}

export async function listReports(opts: { status?: "open" | "resolved" | "all" } = {}) {
  const status = opts.status ?? "open";
  const where = status === "all" ? "" : " WHERE r.status = ?";
  const params: SqlParam[] = status === "all" ? [] : [status];
  return all<{
    id: string;
    reporterId: string | null;
    reporterName: string | null;
    targetType: string;
    targetId: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    targetPreview: string | null;
    targetStatus: string | null;
    targetAuthorId: string | null;
    targetAuthorName: string | null;
  }>(
    `SELECT r.id, r.reporter_id AS reporterId, ru.username AS reporterName,
            r.target_type AS targetType, r.target_id AS targetId, r.reason, r.details,
            r.status, r.created_at AS createdAt,
            CASE r.target_type
              WHEN 'post' THEN (SELECT p.title FROM posts p WHERE p.id = r.target_id)
              ELSE (SELECT substr(c.body, 1, 160) FROM comments c WHERE c.id = r.target_id)
            END AS targetPreview,
            CASE r.target_type
              WHEN 'post' THEN (SELECT p.status FROM posts p WHERE p.id = r.target_id)
              ELSE (SELECT c.status FROM comments c WHERE c.id = r.target_id)
            END AS targetStatus,
            CASE r.target_type
              WHEN 'post' THEN (SELECT p.user_id FROM posts p WHERE p.id = r.target_id)
              ELSE (SELECT c.user_id FROM comments c WHERE c.id = r.target_id)
            END AS targetAuthorId,
            CASE r.target_type
              WHEN 'post' THEN (SELECT u.username FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = r.target_id)
              ELSE (SELECT u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = r.target_id)
            END AS targetAuthorName
       FROM reports r
       LEFT JOIN users ru ON ru.id = r.reporter_id${where}
      ORDER BY r.created_at DESC LIMIT 200`,
    params,
  );
}

export async function resolveReport(id: string, resolverId: string, note?: string | null) {
  await run(
    "UPDATE reports SET status = 'resolved', resolved_by = ?, resolution_note = ?, resolved_at = ? WHERE id = ?",
    [resolverId, note?.trim() || null, now(), id],
  );
}

// ----------------------------------------------------------------------------
// Estadísticas y perfiles
// ----------------------------------------------------------------------------

export async function getCommunityStats() {
  const row = await one<{
    posts: number;
    opinions: number;
    comments: number;
    members: number;
  }>(`SELECT
        (SELECT COUNT(*) FROM posts WHERE status = 'published') AS posts,
        (SELECT COUNT(*) FROM posts WHERE kind = 'opinion' AND status = 'published') AS opinions,
        (SELECT COUNT(*) FROM comments WHERE status = 'published') AS comments,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS members`);
  return row ?? { posts: 0, opinions: 0, comments: 0, members: 0 };
}

/** Contenido de un usuario, para su perfil público y para el panel. */
export async function getUserCommunity(userId: string, opts: { includeHidden?: boolean } = {}) {
  const hidden = opts.includeHidden ? "" : " AND p.status = 'published'";
  const hiddenC = opts.includeHidden ? "" : " AND c.status = 'published'";

  const posts = await all<PostRow>(
    `${POST_SELECT} WHERE p.user_id = ?${hidden} ORDER BY p.created_at DESC LIMIT 100`,
    ["", userId],
  );
  const comments = await all<CommentRow & { postTitle: string | null; postGameSlug: string | null }>(
    `${COMMENT_SELECT}
      LEFT JOIN posts p ON p.id = c.post_id
      LEFT JOIN games g ON g.id = p.game_id
     WHERE c.user_id = ?${hiddenC} ORDER BY c.created_at DESC LIMIT 100`,
    ["", userId],
  );
  const opinions = posts.filter((p) => p.kind === "opinion");
  return { posts, comments, opinions };
}

/** Opiniones publicadas sobre un juego, para la ficha del juego. */
export async function getGameOpinions(
  gameId: string,
  opts: { viewerId?: string | null; limit?: number } = {},
) {
  return all<PostRow>(
    `${POST_SELECT}
      WHERE p.game_id = ? AND p.kind = 'opinion' AND p.status = 'published'
      ORDER BY p.votes_count DESC, p.created_at DESC LIMIT ?`,
    [opts.viewerId ?? "", gameId, opts.limit ?? 20],
  );
}

/** Opinaiones + media de dificultad y horas declaradas por la comunidad. */
export async function getGameOpinionSummary(gameId: string) {
  const row = await one<{ count: number; avgDifficulty: number | null; avgHours: number | null }>(
    `SELECT COUNT(*) AS count,
            AVG(rating_difficulty) AS avgDifficulty,
            AVG(rating_hours) AS avgHours
       FROM posts WHERE game_id = ? AND kind = 'opinion' AND status = 'published'`,
    [gameId],
  );
  return {
    count: row?.count ?? 0,
    avgDifficulty: row?.avgDifficulty != null ? Math.round(row.avgDifficulty * 10) / 10 : null,
    avgHours: row?.avgHours != null ? Math.round(row.avgHours * 10) / 10 : null,
  };
}

/** Posts de un juego (cualquier tipo) para el bloque «sobre este juego». */
export async function getGameCommunityPosts(
  gameId: string,
  opts: { viewerId?: string | null; limit?: number } = {},
) {
  return all<PostRow>(
    `${POST_SELECT}
      WHERE p.game_id = ? AND p.status = 'published'
      ORDER BY p.created_at DESC LIMIT ?`,
    [opts.viewerId ?? "", gameId, opts.limit ?? 10],
  );
}

export async function getUserCommunityCounts(userId: string) {
  const row = await one<{ posts: number; comments: number; votes: number }>(
    `SELECT
      (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'published') AS posts,
      (SELECT COUNT(*) FROM comments WHERE user_id = ? AND status = 'published') AS comments,
      (SELECT COUNT(*) FROM post_votes WHERE user_id = ?) AS votes`,
    [userId, userId, userId],
  );
  return row ?? { posts: 0, comments: 0, votes: 0 };
}

export async function getPublicProfile(username: string) {
  return one<{
    id: string;
    username: string;
    displayName: string | null;
    role: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
  }>(
    `SELECT id, username, display_name AS displayName, role, bio,
            avatar_url AS avatarUrl, created_at AS createdAt
       FROM users WHERE username = ? AND status = 'active'`,
    [username.toLowerCase().trim()],
  );
}

export async function updateUserProfile(input: {
  userId: string;
  displayName?: string | null;
  bio?: string | null;
}) {
  const name = input.displayName?.trim() || null;
  const bio = input.bio?.trim().slice(0, 400) || null;
  await run("UPDATE users SET display_name = ?, bio = ?, updated_at = ? WHERE id = ?", [
    name,
    bio,
    now(),
    input.userId,
  ]);
}

// ----------------------------------------------------------------------------
// Actividad
// ----------------------------------------------------------------------------

export async function logActivity(
  userId: string | null,
  action: string,
  entityType?: string | null,
  entityId?: string | null,
  summary?: string | null,
) {
  try {
    await run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId("act"), userId, action, entityType ?? null, entityId ?? null, summary ?? null, now()],
    );
  } catch {
    // El registro de actividad nunca debe romper la acción principal.
  }
}

export async function getUserActivity(userId: string, limit = 100) {
  return all<{
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    summary: string | null;
    createdAt: string;
  }>(
    `SELECT id, action, entity_type AS entityType, entity_id AS entityId,
            summary, created_at AS createdAt
       FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
  );
}

export async function listRecentActivity(limit = 40) {
  return all<{
    id: string;
    userId: string | null;
    username: string | null;
    action: string;
    summary: string | null;
    createdAt: string;
  }>(
    `SELECT a.id, a.user_id AS userId, u.username, a.action, a.summary, a.created_at AS createdAt
       FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );
}