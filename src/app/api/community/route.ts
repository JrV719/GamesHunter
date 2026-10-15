import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { logActivity, toggleCommentVote, togglePostVote } from "@/lib/community";

/**
 * Voto a una publicación o a un comentario.
 *
 * El objetivo tiene que existir: se comprueba contra la tabla antes de contar,
 * para no crear votos colgando de filas inexistentes ni filtrar IDs ajenos.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Necesitas iniciar sesión para votar." },
      { status: 401 },
    );
  }

  let body: { targetType?: string; targetId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const { targetType, targetId } = body;
  if (!targetType || !targetId) {
    return NextResponse.json({ ok: false, error: "Faltan parámetros." }, { status: 400 });
  }

  if (targetType === "post") {
    const post = await one<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM posts WHERE id = ?",
      [targetId],
    );
    if (!post) {
      return NextResponse.json({ ok: false, error: "La publicación no existe." }, { status: 404 });
    }
    const active = await togglePostVote(targetId, user.id);
    const row = await one<{ n: number }>("SELECT COUNT(*) AS n FROM post_votes WHERE post_id = ?", [
      targetId,
    ]);
    return NextResponse.json({ ok: true, active, value: row?.n ?? 0 });
  }

  if (targetType === "comment") {
    const comment = await one<{ id: string; status: string }>(
      "SELECT id, status FROM comments WHERE id = ?",
      [targetId],
    );
    if (!comment) {
      return NextResponse.json({ ok: false, error: "El comentario no existe." }, { status: 404 });
    }
    if (comment.status !== "published") {
      return NextResponse.json({ ok: false, error: "Ese comentario está oculto." }, { status: 409 });
    }
    const active = await toggleCommentVote(targetId, user.id);
    const row = await one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM comment_votes WHERE comment_id = ?",
      [targetId],
    );
    return NextResponse.json({ ok: true, active, value: row?.n ?? 0 });
  }

  return NextResponse.json({ ok: false, error: "Objetivo desconocido." }, { status: 400 });
}

/** Registra una denuncia de contenido. */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Necesitas iniciar sesión." }, { status: 401 });
  }

  let body: { targetType?: string; targetId?: string; reason?: string; details?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const { targetType, targetId, reason, details } = body;
  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ ok: false, error: "Faltan parámetros." }, { status: 400 });
  }
  if (targetType !== "post" && targetType !== "comment") {
    return NextResponse.json({ ok: false, error: "Objetivo desconocido." }, { status: 400 });
  }

  // No se puede denunciar el propio contenido.
  const owner =
    targetType === "post"
      ? await one<{ user_id: string }>("SELECT user_id FROM posts WHERE id = ?", [targetId])
      : await one<{ user_id: string }>("SELECT user_id FROM comments WHERE id = ?", [targetId]);
  if (!owner) {
    return NextResponse.json({ ok: false, error: "El contenido no existe." }, { status: 404 });
  }
  if (owner.user_id === user.id) {
    return NextResponse.json(
      { ok: false, error: "No puedes denunciar tu propio contenido." },
      { status: 400 },
    );
  }

  const duplicate = await one<{ id: string }>(
    "SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'",
    [user.id, targetType, targetId],
  );
  if (duplicate) {
    return NextResponse.json(
      { ok: false, error: "Ya has denunciado este contenido." },
      { status: 409 },
    );
  }

  const { newId } = await import("@/lib/queries/guides");
  await run(
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
    [
      newId("rep"),
      user.id,
      targetType,
      targetId,
      reason,
      details?.trim().slice(0, 500) || null,
      new Date().toISOString(),
    ],
  );
  await logActivity(user.id, "report.created", targetType, targetId, `Denuncia: ${reason}`);

  return NextResponse.json({ ok: true });
}