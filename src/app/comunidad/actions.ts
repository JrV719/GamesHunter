"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  CommunityError,
  createComment,
  createPost,
  deleteComment,
  deletePost,
  logActivity,
  resolveReport as resolveReportAction,
  setCommentStatus,
  setPostPinned,
  setPostStatus,
  toggleCommentVote,
  togglePostVote,
  updateComment,
  updatePost,
  updateUserProfile,
} from "@/lib/community";
import {
  authorizeContentEdit,
  requireStaff,
  requireUser,
} from "@/lib/permissions";
import { one } from "@/lib/db";

// ============================================================================
// Server Actions de la comunidad
// ----------------------------------------------------------------------------
// Cada acción vuelve a comprobar la sesión y la propiedad del recurso. Una
// Server Action es un endpoint HTTP público: que el botón esté oculto en la
// interfaz no protege nada, así que el permiso se valida aquí dentro.
// ============================================================================

/** Redirige conservando un mensaje de error legible. */
function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function num(fd: FormData, key: string): number | null {
  const raw = fd.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ----------------------------------------------------------------------------
// Publicaciones
// ----------------------------------------------------------------------------

export async function submitPost(formData: FormData) {
  const user = await requireUser("/comunidad/nueva");

  const kind = String(formData.get("kind") ?? "post");
  const gameId = String(formData.get("gameId") ?? "") || null;
  const topicId = String(formData.get("topicId") ?? "") || null;

  try {
    const id = await createPost({
      userId: user.id,
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      kind,
      topicId,
      gameId,
      ratingDifficulty: num(formData, "ratingDifficulty"),
      ratingHours: num(formData, "ratingHours"),
      ratingOverall: num(formData, "ratingOverall"),
    });
    revalidatePath("/comunidad");
    redirect(`/comunidad/${id}`);
  } catch (e) {
    if (e instanceof CommunityError) fail("/comunidad/nueva", e.message);
    throw e;
  }
}

export async function savePostEdit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const post = await one<{ userId: string; gameSlug: string | null }>(
    "SELECT user_id AS userId, (SELECT slug FROM games WHERE id = posts.game_id) AS gameSlug FROM posts WHERE id = ?",
    [id],
  );
  if (!post) redirect("/comunidad");

  // Aquí se decide si puede: el autor, o quien pueda moderar.
  const auth = await authorizeContentEdit(post.userId);
  if (!auth.ok) redirect(`/comunidad/${id}?error=${encodeURIComponent(auth.error)}`);

  try {
    await updatePost({
      id,
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      topicId: String(formData.get("topicId") ?? "") || null,
      gameId: String(formData.get("gameId") ?? "") || null,
      ratingDifficulty: num(formData, "ratingDifficulty"),
      ratingHours: num(formData, "ratingHours"),
      ratingOverall: num(formData, "ratingOverall"),
    });
    await logActivity(auth.user.id, "post.updated", "post", id, "Publicación editada");
    revalidatePath("/comunidad");
    revalidatePath(`/comunidad/${id}`);
    if (post.gameSlug) revalidatePath(`/juegos/${post.gameSlug}`);
    redirect(`/comunidad/${id}?guardado=1`);
  } catch (e) {
    if (e instanceof CommunityError) fail(`/comunidad/${id}/editar`, e.message);
    throw e;
  }
}

/** El autor borra la suya; un moderador, cualquiera. */
export async function removePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const post = await one<{ userId: string; gameSlug: string | null; title: string }>(
    `SELECT user_id AS userId, title, (SELECT slug FROM games WHERE id = posts.game_id) AS gameSlug
       FROM posts WHERE id = ?`,
    [id],
  );
  if (!post) redirect("/comunidad");

  const auth = await authorizeContentEdit(post.userId);
  if (!auth.ok) redirect(`/comunidad/${id}?error=${encodeURIComponent(auth.error)}`);

  await deletePost(id);
  await logActivity(auth.user.id, "post.deleted", "post", id, `Publicación eliminada: ${post.title}`);
  revalidatePath("/comunidad");
  revalidatePath(`/comunidad/${id}`);
  if (post.gameSlug) revalidatePath(`/juegos/${post.gameSlug}`);
  redirect(`/comunidad?borrado=1`);
}

export async function toggleVote(formData: FormData) {
  const user = await requireUser();
  const targetType = String(formData.get("targetType") ?? "post");
  const id = String(formData.get("targetId") ?? "");
  if (!id) redirect("/comunidad");

  if (targetType === "comment") {
    const comment = await one<{ postId: string }>("SELECT post_id AS postId FROM comments WHERE id = ?", [id]);
    if (!comment) redirect("/comunidad");
    await toggleCommentVote(id, user.id);
    revalidatePath(`/comunidad/${comment.postId}`);
  } else {
    await togglePostVote(id, user.id);
    revalidatePath(`/comunidad/${id}`);
  }
}

/** Opinión publicada directamente desde la ficha de un juego. */
export async function submitGameOpinion(formData: FormData) {
  const user = await requireUser();
  const gameId = String(formData.get("gameId") ?? "");
  const gameTitle = String(formData.get("gameTitle") ?? gameId);
  if (!gameId) redirect("/comunidad");

  // El título se arma aquí: quien opina desde la ficha no escribe uno.
  const body = String(formData.get("body") ?? "").trim();
  const title = `Opinión: ${gameTitle}`.slice(0, 140);

  try {
    await createPost({
      userId: user.id,
      title,
      body,
      kind: "opinion",
      gameId,
      topicId: null,
      ratingDifficulty: num(formData, "ratingDifficulty"),
      ratingHours: num(formData, "ratingHours"),
      ratingOverall: num(formData, "ratingOverall"),
    });
  } catch (e) {
    if (e instanceof CommunityError) fail("/comunidad", e.message);
    throw e;
  }

  const slug = String(formData.get("gameSlug") ?? "");
  revalidatePath("/comunidad");
  if (slug) revalidatePath(`/juegos/${slug}`);
  redirect(slug ? `/juegos/${slug}#comunidad` : "/comunidad");
}

// ----------------------------------------------------------------------------
// Comentarios
// ----------------------------------------------------------------------------

export async function addComment(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const parentId = String(formData.get("parentId") ?? "") || null;
  if (!postId) redirect("/comunidad");

  try {
    await createComment({
      postId,
      userId: user.id,
      body: String(formData.get("body") ?? ""),
      parentId,
    });
    revalidatePath(`/comunidad/${postId}`);
    revalidatePath("/comunidad");
    redirect(`/comunidad/${postId}#comentarios`);
  } catch (e) {
    if (e instanceof CommunityError) fail(`/comunidad/${postId}`, e.message);
    throw e;
  }
}

/** El autor borra su comentario; moderación, cualquiera. */
export async function removeComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const comment = await one<{ userId: string; postId: string }>(
    "SELECT user_id AS userId, post_id AS postId FROM comments WHERE id = ?",
    [id],
  );
  if (!comment) redirect("/comunidad");

  const auth = await authorizeContentEdit(comment.userId);
  if (!auth.ok) redirect(`/comunidad/${comment.postId}?error=${encodeURIComponent(auth.error)}`);

  await deleteComment(id);
  await logActivity(auth.user.id, "comment.deleted", "comment", id, "Comentario eliminado");
  revalidatePath(`/comunidad/${comment.postId}`);
  redirect(`/comunidad/${comment.postId}#comentarios`);
}

export async function editComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const comment = await one<{ userId: string; postId: string }>(
    "SELECT user_id AS userId, post_id AS postId FROM comments WHERE id = ?",
    [id],
  );
  if (!comment) redirect("/comunidad");

  const auth = await authorizeContentEdit(comment.userId);
  if (!auth.ok) redirect(`/comunidad/${comment.postId}?error=${encodeURIComponent(auth.error)}`);

  try {
    await updateComment(id, String(formData.get("body") ?? ""));
    await logActivity(auth.user.id, "comment.updated", "comment", id, "Comentario editado");
    revalidatePath(`/comunidad/${comment.postId}`);
    redirect(`/comunidad/${comment.postId}#comentarios`);
  } catch (e) {
    if (e instanceof CommunityError) fail(`/comunidad/${comment.postId}`, e.message);
    throw e;
  }
}

// ----------------------------------------------------------------------------
// Moderación
// ----------------------------------------------------------------------------

export async function moderatePost(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  // Vuelve a la pestaña desde la que se moderó, no siempre a la de denuncias.
  const vista = String(formData.get("vista") ?? "publicaciones");

  if (!id) redirect("/admin/comunidad");

  if (action === "hide" || action === "publish") {
    await setPostStatus(id, action === "hide" ? "hidden" : "published", null);
    await logActivity(user.id, `post.${action}`, "post", id, `Publicación ${action === "hide" ? "oculta" : "publicada"}`);
  } else if (action === "delete") {
    await deletePost(id);
    await logActivity(user.id, "post.deleted", "post", id, "Publicación eliminada por moderación");
  } else if (action === "pin") {
    await setPostPinned(id, String(formData.get("pinned")) === "1");
  }

  revalidatePath("/comunidad");
  revalidatePath("/admin/comunidad");
  revalidatePath(`/comunidad/${id}`);
  redirect(`/admin/comunidad?vista=${encodeURIComponent(vista)}&hecho=${encodeURIComponent(action)}`);
}

export async function moderateComment(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const vista = String(formData.get("vista") ?? "comentarios");
  if (!id) redirect("/admin/comunidad");

  if (action === "hide" || action === "publish") {
    await setCommentStatus(id, action === "hide" ? "hidden" : "published", null);
    await logActivity(user.id, `comment.${action}`, "comment", id, `Comentario ${action === "hide" ? "oculto" : "publicado"}`);
  } else if (action === "delete") {
    await deleteComment(id);
    await logActivity(user.id, "comment.deleted", "comment", id, "Comentario eliminado por moderación");
  }

  revalidatePath("/admin/comunidad");
  revalidatePath(`/comunidad/${formData.get("postId") ?? ""}`);
  redirect(`/admin/comunidad?vista=${encodeURIComponent(vista)}&hecho=${encodeURIComponent(action)}`);
}

/** Cierra una denuncia una vez revisada. */
export async function resolveReport(formData: FormData) {
  const user = await requireStaff("/admin/comunidad");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/comunidad");
  await resolveReportAction(id, user.id, String(formData.get("note") ?? ""));
  revalidatePath("/admin/comunidad");
  redirect("/admin/comunidad?vista=denuncias");
}

// ----------------------------------------------------------------------------
// Perfil
// ----------------------------------------------------------------------------

export async function saveProfile(formData: FormData) {
  const user = await requireUser("/perfil");
  await updateUserProfile({
    userId: user.id,
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });
  revalidatePath("/perfil");
  revalidatePath(`/usuarios/${user.username}`);
  redirect("/perfil?perfil=1");
}