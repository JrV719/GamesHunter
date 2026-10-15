import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import {
  getUserActivity,
  getUserCommunity,
  getUserCommunityCounts,
} from "@/lib/community";
import { setUserRole, setUserStatus, getUserStats, getUserCollection } from "@/lib/auth";
import { Avatar } from "@/components/community/PostCard";
import { EmptyState } from "@/components/ui/primitives";
import {
  IconChat,
  IconExternal,
  IconMessage,
  IconUsers,
} from "@/components/ui/Icon";
import { USER_ROLES, USER_GAME_STATUS_LABELS, type UserGameStatus } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ficha de usuario", robots: { index: false } };

type RouteParams = Promise<{ id: string }>;

/** Etiqueta legible de una acción del registro de actividad. */
const ACTION_LABELS: Record<string, string> = {
  "post.created": "Publicación creada",
  "post.updated": "Publicación editada",
  "post.deleted": "Publicación eliminada",
  "post.hide": "Publicación ocultada por moderación",
  "post.publish": "Publicación publicada",
  "comment.created": "Comentario publicado",
  "comment.updated": "Comentario editado",
  "comment.deleted": "Comentario eliminado",
  "comment.hide": "Comentario ocultado por moderación",
  "report.created": "Contenido denunciado",
};

export default async function AdminUserPage({ params }: { params: RouteParams }) {
  const me = await requireAdmin();
  const { id } = await params;

  const user = await one<{
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    role: string;
    status: string;
    bio: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    `SELECT id, email, username, display_name AS displayName, role, status, bio,
            created_at AS createdAt, updated_at AS updatedAt
       FROM users WHERE id = ?`,
    [id],
  );
  if (!user) notFound();

  const [activity, content, counts, stats, collection] = await Promise.all([
    getUserActivity(user.id),
    getUserCommunity(user.id, { includeHidden: true }),
    getUserCommunityCounts(user.id),
    getUserStats(user.id),
    getUserCollection(user.id),
  ]);

  const hiddenCount =
    content.posts.filter((p) => p.status !== "published").length +
    content.comments.filter((c) => c.status !== "published").length;

  async function changeRole(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const userId = String(formData.get("id") ?? "");
    const role = String(formData.get("role") ?? "user");
    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) return;
    if (userId === admin.id && role !== "admin") return;
    await setUserRole(userId, role);
    revalidatePath(`/admin/usuarios/${userId}`);
    revalidatePath("/admin/usuarios");
  }

  async function changeStatus(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const userId = String(formData.get("id") ?? "");
    if (userId === admin.id) return;
    const status = String(formData.get("status") ?? "active");
    if (!["active", "suspended"].includes(status)) return;
    await setUserStatus(userId, status);
    revalidatePath(`/admin/usuarios/${userId}`);
    revalidatePath("/admin/usuarios");
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta" className="text-[11px] text-base-500">
        <Link href="/admin/usuarios" className="gh-link">
          Usuarios
        </Link>
        <span aria-hidden="true"> / </span>
        <span>@{user.username}</span>
      </nav>

      {/* Cabecera */}
      <header className="gh-card flex flex-wrap items-start gap-4 p-5">
        <Avatar name={user.displayName ?? user.username} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-base-100">
            {user.displayName ?? user.username}
            {user.id === me.id && (
              <span className="text-[11px] font-normal text-accent-300">(tú)</span>
            )}
          </h1>
          <p className="text-sm text-base-400">
            @{user.username} · {user.email}
          </p>
          {user.bio && <p className="mt-2 max-w-2xl text-[13px] text-base-300">{user.bio}</p>}
          <p className="mt-1.5 text-[11px] text-base-500">
            Alta {formatDate(user.createdAt)} · Última actualización {timeAgo(user.updatedAt)}
          </p>
        </div>
        <Link href={`/usuarios/${user.username}`} className="gh-btn gh-btn-ghost text-xs">
          <IconExternal size={13} /> Ver perfil público
        </Link>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Publicaciones", value: counts.posts, icon: IconChat },
          { label: "Opiniones", value: content.opinions.length, icon: IconMessage },
          { label: "Comentarios", value: counts.comments, icon: IconMessage },
          { label: "Votos dados", value: counts.votes, icon: IconMessage },
          { label: "Platinos", value: stats.platinas, icon: IconUsers },
          { label: "Oculto", value: hiddenCount, icon: IconMessage },
        ].map((s) => (
          <div key={s.label} className="gh-card p-3.5">
            <s.icon size={15} className="text-accent-400" />
            <p className="mt-1.5 font-mono text-xl font-black text-base-100">{s.value}</p>
            <p className="text-[11px] text-base-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Publicaciones */}
          <section>
            <h2 className="gh-section-title mb-3">Publicaciones ({content.posts.length})</h2>
            {content.posts.length === 0 ? (
              <EmptyState title="Sin publicaciones" icon={<IconChat size={22} />} />
            ) : (
              <ul className="space-y-2">
                {content.posts.map((p) => (
                  <li key={p.id} className="gh-card p-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <Link href={`/comunidad/${p.id}`} className="font-semibold text-base-100 hover:text-accent-300">
                        {p.title}
                      </Link>
                      {p.status !== "published" && (
                        <span className="gh-chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                          oculta
                        </span>
                      )}
                      <span className="ml-auto text-base-500">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] text-base-500">{p.body}</p>
                    {p.gameTitle && (
                      <p className="mt-1 text-[11px] text-accent-300">sobre {p.gameTitle}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Comentarios */}
          <section>
            <h2 className="gh-section-title mb-3">Comentarios ({content.comments.length})</h2>
            {content.comments.length === 0 ? (
              <EmptyState title="Sin comentarios" icon={<IconMessage size={22} />} />
            ) : (
              <ul className="space-y-2">
                {content.comments.slice(0, 25).map((c) => (
                  <li key={c.id} className="gh-card p-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <Link href={`/comunidad/${c.postId}#${c.id}`} className="gh-link line-clamp-1">
                        {(c as { postTitle?: string }).postTitle ?? "Publicación"}
                      </Link>
                      {c.status !== "published" && (
                        <span className="gh-chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                          oculto
                        </span>
                      )}
                      <span className="ml-auto text-base-500">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-[12px] text-base-500">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Actividad */}
          <section>
            <h2 className="gh-section-title mb-3">Actividad registrada</h2>
            {activity.length === 0 ? (
              <EmptyState
                title="Sin actividad registrada"
                description="El registro empieza a llenarse con las publicaciones y comentarios nuevos."
                icon={<IconMessage size={22} />}
              />
            ) : (
              <ol className="space-y-1.5">
                {activity.slice(0, 40).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-[12px]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500/60" />
                    <span className="font-semibold text-base-300">
                      {ACTION_LABELS[a.action] ?? a.action}
                    </span>
                    {a.summary && <span className="min-w-0 flex-1 text-base-500">{a.summary}</span>}
                    <span className="ml-auto shrink-0 text-[11px] text-base-600">
                      {timeAgo(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Lateral: gestión */}
        <aside className="space-y-4">
          <div className="gh-card space-y-4 p-4">
            <h2 className="gh-section-title">Gestión de la cuenta</h2>

            <form action={changeRole} className="space-y-1.5">
              <label className="gh-label" htmlFor="role">
                Rol
              </label>
              <input type="hidden" name="id" value={user.id} />
              <div className="flex gap-2">
                <select id="role" name="role" defaultValue={user.role} className="gh-input text-xs">
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "user" ? "Usuario" : r === "moderator" ? "Moderador" : "Administrador"}
                    </option>
                  ))}
                </select>
                <button type="submit" className="gh-btn gh-btn-ghost text-[11px]">
                  Guardar
                </button>
              </div>
              <p className="text-[11px] text-base-500">
                Los moderadores gestionan la comunidad. Sólo los administradores cambian juegos,
                guías o usuarios.
              </p>
            </form>

            <form action={changeStatus} className="space-y-1.5">
              <label className="gh-label" htmlFor="status">
                Estado
              </label>
              <input type="hidden" name="id" value={user.id} />
              <div className="flex gap-2">
                <select id="status" name="status" defaultValue={user.status} className="gh-input text-xs">
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
                <button
                  type="submit"
                  disabled={user.id === me.id}
                  className="gh-btn gh-btn-ghost text-[11px] disabled:opacity-40"
                >
                  Guardar
                </button>
              </div>
              {user.id === me.id && (
                <p className="text-[11px] text-base-500">No puedes cambiar tu propio estado.</p>
              )}
            </form>
          </div>

          {/* Biblioteca resumida */}
          <div className="gh-card p-4">
            <h2 className="gh-section-title mb-2">Juegos registrados</h2>
            {collection.library.length === 0 && collection.platinas.length === 0 ? (
              <p className="text-[12px] text-base-500">Sin juegos en su biblioteca.</p>
            ) : (
              <ul className="space-y-1.5">
                {collection.library.slice(0, 12).map((g: Record<string, unknown>) => (
                  <li key={String(g.slug)} className="flex items-center justify-between gap-2 text-[12px]">
                    <Link href={`/juegos/${g.slug}`} className="truncate text-base-300 hover:text-accent-300">
                      {String(g.title)}
                    </Link>
                    <span className="shrink-0 text-[10px] text-base-500">
                      {USER_GAME_STATUS_LABELS[String(g.status) as UserGameStatus] ?? String(g.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 border-t border-base-700 pt-2 text-[11px] text-base-500">
              {collection.favorites.length} favorito
              {collection.favorites.length === 1 ? "" : "s"} · {collection.platinas.length} platino
              {collection.platinas.length === 1 ? "" : "s"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}