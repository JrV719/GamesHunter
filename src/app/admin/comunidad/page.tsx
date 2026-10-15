import type { Metadata } from "next";
import Link from "next/link";
import { all } from "@/lib/db";
import { requireStaff } from "@/lib/permissions";
import { listReports, listPosts, getCommunityStats } from "@/lib/community";
import { moderateComment, moderatePost, resolveReport } from "@/app/comunidad/actions";
import { EmptyState } from "@/components/ui/primitives";
import {
  IconChat,
  IconEye,
  IconFlag,
  IconMessage,
  IconPin,
  IconTrash,
} from "@/components/ui/Icon";
import {
  POST_KIND_LABELS,
  REPORT_REASON_LABELS,
  type PostKind,
  type ReportReason,
} from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Moderar comunidad", robots: { index: false } };

type SearchParams = Promise<{ vista?: string; hecho?: string; juego?: string }>;

export default async function AdminCommunityPage({ searchParams }: { searchParams: SearchParams }) {
  await requireStaff();
  const sp = await searchParams;
  const view = sp.vista ?? "denuncias";

  const [reports, posts, comments, stats] = await Promise.all([
    listReports({ status: "open" }),
    listPosts({ sort: "recientes", pageSize: 30, viewerIsStaff: true, includeHidden: true }),
    all<{
      id: string;
      postId: string;
      userId: string;
      body: string;
      status: string;
      createdAt: string;
      username: string;
      displayName: string | null;
      postTitle: string | null;
    }>(
      `SELECT c.id, c.post_id AS postId, c.user_id AS userId, c.body, c.status,
              c.created_at AS createdAt,
              u.username, u.display_name AS displayName, p.title AS postTitle
         FROM comments c
         JOIN users u ON u.id = c.user_id
         JOIN posts p ON p.id = c.post_id
        ORDER BY c.created_at DESC LIMIT 30`,
    ),
    getCommunityStats(),
  ]);

  const hiddenPosts = posts.posts.filter((p) => p.status !== "published");

  return (
    <div className="space-y-5">
      {sp.hecho && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-2.5 text-sm text-emerald-200">
          Acción aplicada correctamente.
        </p>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Publicaciones", value: stats.posts, icon: IconChat },
          { label: "Opiniones", value: stats.opinions, icon: IconMessage },
          { label: "Comentarios", value: stats.comments, icon: IconMessage },
          { label: "Denuncias abiertas", value: reports.length, icon: IconFlag },
          { label: "Contenido oculto", value: hiddenPosts.length, icon: IconEye },
        ].map((s) => (
          <div key={s.label} className="gh-card p-3.5">
            <s.icon size={15} className="text-accent-400" />
            <p className="mt-1.5 font-mono text-xl font-black text-base-100">{s.value}</p>
            <p className="text-[11px] text-base-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {[
          { id: "denuncias", label: `Denuncias (${reports.length})` },
          { id: "publicaciones", label: "Publicaciones" },
          { id: "comentarios", label: "Comentarios" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/admin/comunidad?vista=${t.id}`}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              view === t.id
                ? "border-accent-500/50 bg-accent-500/15 text-accent-300"
                : "border-base-700 bg-base-800 text-base-300 hover:border-accent-500/40",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* --- Denuncias --- */}
      {view === "denuncias" &&
        (reports.length === 0 ? (
          <EmptyState
            title="No hay denuncias abiertas"
            description="Cuando alguien marque una publicación o un comentario, aparecerá aquí."
            icon={<IconFlag size={22} />}
          />
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="gh-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <Chip tone="warn">
                    {REPORT_REASON_LABELS[r.reason as ReportReason] ?? r.reason}
                  </Chip>
                  <span className="gh-chip border-base-700 bg-base-850 text-base-400">
                    {r.targetType === "post" ? "Publicación" : "Comentario"}
                  </span>
                  {r.targetStatus && r.targetStatus !== "published" && (
                    <span className="gh-chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                      Ya está oculto
                    </span>
                  )}
                  <span className="ml-auto text-base-500">{timeAgo(r.createdAt)}</span>
                </div>

                <p className="mt-2 text-[13px] leading-relaxed text-base-200">
                  «{r.targetPreview ?? "Contenido ya no disponible"}»
                </p>
                <p className="mt-1 text-[11px] text-base-500">
                  Autor:{" "}
                  {r.targetAuthorId ? (
                    <Link href={`/admin/usuarios/${r.targetAuthorId}`} className="gh-link">
                      @{r.targetAuthorName}
                    </Link>
                  ) : (
                    "desconocido"
                  )}
                  {r.reporterId && " · Denunciado por un miembro"}
                </p>
                {r.details && (
                  <p className="mt-1.5 rounded-lg bg-base-850 px-3 py-2 text-[12px] text-base-400">
                    {r.details}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-base-700 pt-3">
                  {r.targetType === "post" ? (
                    <>
                      <PostAction id={r.targetId} action="hide" label="Ocultar" />
                      <PostAction id={r.targetId} action="delete" label="Eliminar" danger />
                    </>
                  ) : (
                    <>
                      <CommentAction id={r.targetId} postId={r.targetId} action="hide" label="Ocultar" />
                      <CommentAction
                        id={r.targetId}
                        postId={r.targetId}
                        action="delete"
                        label="Eliminar"
                        danger
                      />
                    </>
                  )}

                  <form action={resolveReport} className="ml-auto">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="note"
                      value="Revisada: el contenido ya está oculto."
                    />
                    <button type="submit" className="gh-btn gh-btn-ghost text-xs">
                      Marcar como resuelta
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {/* --- Publicaciones --- */}
      {view === "publicaciones" && (
        <div className="gh-card overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-[13px]">
            <thead>
              <tr className="border-b border-base-700 text-[10px] uppercase tracking-wider text-base-500">
                <th className="px-4 py-2.5 font-bold">Título</th>
                <th className="px-4 py-2.5 font-bold">Autor</th>
                <th className="px-4 py-2.5 font-bold">Tipo</th>
                <th className="px-4 py-2.5 font-bold">Estado</th>
                <th className="px-4 py-2.5 font-bold">Fecha</th>
                <th className="px-4 py-2.5 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700/60">
              {posts.posts.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-base-850/50">
                  <td className="max-w-xs px-4 py-2.5">
                    <Link href={`/comunidad/${p.id}`} className="font-semibold text-base-100 hover:text-accent-300">
                      {p.title}
                    </Link>
                    {p.gameTitle && (
                      <p className="text-[10px] text-base-500">en {p.gameTitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/usuarios/${p.userId}`} className="text-base-300 hover:text-accent-300">
                      @{p.username}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-base-400">
                    {POST_KIND_LABELS[p.kind as PostKind] ?? p.kind}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "gh-chip",
                        p.status === "published"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                      )}
                    >
                      {p.status === "published" ? "visible" : "oculta"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-base-400">{timeAgo(p.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "published" ? (
                        <PostAction id={p.id} action="hide" label="Ocultar" small />
                      ) : (
                        <PostAction id={p.id} action="publish" label="Publicar" small />
                      )}
                      <form action={moderatePost}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="action" value="pin" />
                        <input type="hidden" name="pinned" value={p.isPinned ? "0" : "1"} />
                        <button
                          type="submit"
                          className={cn(
                            "gh-btn text-[11px]",
                            p.isPinned
                              ? "gh-btn-primary"
                              : "gh-btn-ghost",
                          )}
                        >
                          <IconPin size={12} /> {p.isPinned ? "Quitar" : "Fijar"}
                        </button>
                      </form>
                      <PostAction id={p.id} action="delete" label="Eliminar" small danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Comentarios --- */}
      {view === "comentarios" &&
        (comments.length === 0 ? (
          <EmptyState
            title="Sin comentarios"
            description="Todavía no hay comentarios en la comunidad."
            icon={<IconMessage size={22} />}
          />
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="gh-card p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <Link href={`/admin/usuarios/${c.userId}`} className="font-semibold text-base-200">
                    @{c.username}
                  </Link>
                  <span className="text-base-500">en</span>
                  <Link href={`/comunidad/${c.postId}#${c.id}`} className="gh-link line-clamp-1">
                    {c.postTitle}
                  </Link>
                  <span className="ml-auto text-base-500">{timeAgo(c.createdAt)}</span>
                  {c.status !== "published" && (
                    <span className="gh-chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                      oculto
                    </span>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-base-400">
                  {c.body}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-base-700 pt-2.5">
                  {c.status === "published" ? (
                    <CommentAction id={c.id} postId={c.postId} action="hide" label="Ocultar" small />
                  ) : (
                    <CommentAction
                      id={c.id}
                      postId={c.postId}
                      action="publish"
                      label="Publicar"
                      small
                    />
                  )}
                  <CommentAction
                    id={c.id}
                    postId={c.postId}
                    action="delete"
                    label="Eliminar"
                    small
                    danger
                  />
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warn" }) {
  return (
    <span
      className={cn(
        "gh-chip",
        tone === "warn"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-base-700 bg-base-850 text-base-400",
      )}
    >
      {children}
    </span>
  );
}

function PostAction({
  id,
  action,
  label,
  danger,
  small,
}: {
  id: string;
  action: string;
  label: string;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <form action={moderatePost}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={cn(
          "gh-btn",
          small ? "text-[11px]" : "text-xs",
          danger ? "gh-btn-danger" : "gh-btn-ghost",
        )}
      >
        {danger && <IconTrash size={12} />}
        {label}
      </button>
    </form>
  );
}

function CommentAction({
  id,
  postId,
  action,
  label,
  danger,
  small,
}: {
  id: string;
  postId: string;
  action: string;
  label: string;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <form action={moderateComment}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={cn(
          "gh-btn",
          small ? "text-[11px]" : "text-xs",
          danger ? "gh-btn-danger" : "gh-btn-ghost",
        )}
      >
        {danger && <IconTrash size={12} />}
        {label}
      </button>
    </form>
  );
}