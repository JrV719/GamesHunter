import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { all, one, run, tx } from "@/lib/db";
import { newId, deleteGuide, replaceGuideSteps, updateGuide } from "@/lib/queries/guides";
import { getSources } from "@/lib/queries/taxonomy";
import { GUIDE_KINDS, GUIDE_KIND_LABELS, type GuideKind } from "@/lib/constants";
import { IconEdit, IconTrash, IconPlus, IconExternal } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Administrar guías", robots: { index: false } };

type SearchParams = Promise<{ edit?: string; nuevo?: string }>;

export default async function AdminGuidesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const sources = await getSources();

  const guides = await all<{
    id: string;
    slug: string;
    title: string;
    kind: string;
    status: string;
    dataStatus: string;
    gameTitle: string | null;
    gameSlug: string | null;
    updatedAt: string;
    stepCount: number;
  }>(
    `SELECT gu.id, gu.slug, gu.title, gu.kind, gu.status, gu.data_status AS dataStatus,
            gu.updated_at AS updatedAt, g.title AS gameTitle, g.slug AS gameSlug,
            (SELECT COUNT(*) FROM guide_steps gs WHERE gs.guide_id = gu.id) AS stepCount
       FROM guides gu LEFT JOIN games g ON g.id = gu.game_id
      ORDER BY gu.updated_at DESC LIMIT 100`,
  );

  const editing = sp.edit
    ? await one<any>(
        `SELECT id, slug, game_id AS gameId, kind, title, summary, body, status,
                data_status AS dataStatus, is_community AS isCommunity, author_id AS authorId,
                reading_time AS readingTime, view_count AS viewCount, published_at AS publishedAt,
                created_at AS createdAt, updated_at AS updatedAt
           FROM guides WHERE id = ?`,
        [sp.edit],
      )
    : null;
  const editingSteps = editing
    ? await all<{ title: string; body: string; warning: string | null }>(
        "SELECT title, body, warning FROM guide_steps WHERE guide_id = ? ORDER BY step_number",
        [editing.id],
      )
    : [];

  const games = await all<{ id: string; title: string }>(
    "SELECT id, title FROM games ORDER BY title",
  );

  async function saveGuide(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const gameId = String(formData.get("gameId") ?? "") || null;
    const kind = String(formData.get("kind") ?? "platino");
    const status = String(formData.get("status") ?? "published");
    const dataStatus = String(formData.get("dataStatus") ?? "provisional");
    const stepTitles = formData.getAll("stepTitle").map(String);
    const stepBodies = formData.getAll("stepBody").map(String);
    const stepWarnings = formData.getAll("stepWarning").map(String);

    const steps = stepTitles
      .map((t, i) => ({
        title: t.trim(),
        body: (stepBodies[i] ?? "").trim(),
        warning: (stepWarnings[i] ?? "").trim() || null,
      }))
      .filter((s) => s.title && s.body);

    if (!title) redirect("/admin/guias?error=Titulo+obligatorio");

    if (id) {
      await updateGuide(id, { title, summary, body, kind, status, dataStatus });
      await run("UPDATE guides SET game_id = ? WHERE id = ?", [gameId, id]);
      await replaceGuideSteps(id, steps);
      revalidatePath("/admin/guias");
      revalidatePath("/guias");
      redirect("/admin/guias?edit=" + id + "&guardado=1");
    }

    const created = await import("@/lib/queries/guides").then((m) =>
      m.createGuide({
        gameId,
        kind,
        title,
        summary,
        body,
        status,
        dataStatus,
        steps,
        sourceRefs: [],
      }),
    );
    revalidatePath("/admin/guias");
    revalidatePath("/guias");
    redirect("/admin/guias?edit=" + created.id + "&creado=1");
  }

  async function removeGuide(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    await deleteGuide(id);
    revalidatePath("/admin/guias");
    revalidatePath("/guias");
    redirect("/admin/guias?borrado=1");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-base-400">
          {guides.length} guía{guides.length === 1 ? "" : "s"}
        </p>
        <Link href="/admin/guias?nuevo=1" className="gh-btn gh-btn-primary text-xs">
          <IconPlus size={14} /> Nueva guía
        </Link>
      </div>

      {(sp.nuevo || editing) && (
        <div className="gh-card p-5">
          <h2 className="gh-section-title mb-3">
            {editing ? `Editar: ${editing.title}` : "Nueva guía"}
          </h2>
          <form action={saveGuide} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="gh-label">Título *</label>
                <input name="title" required defaultValue={editing?.title ?? ""} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">Juego</label>
                <select name="gameId" defaultValue={editing?.game_id ?? ""} className="gh-input">
                  <option value="">Sin juego asociado</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="gh-label">Tipo</label>
                <select name="kind" defaultValue={editing?.kind ?? "platino"} className="gh-input">
                  {GUIDE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {GUIDE_KIND_LABELS[k as GuideKind]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="gh-label">Estado</label>
                <select name="status" defaultValue={editing?.status ?? "published"} className="gh-input">
                  <option value="published">Publicada</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              <div>
                <label className="gh-label">Estado del dato</label>
                <select
                  name="dataStatus"
                  defaultValue={editing?.data_status ?? "provisional"}
                  className="gh-input"
                >
                  <option value="verified">Verificado</option>
                  <option value="provisional">Provisional</option>
                  <option value="demo">Demo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="gh-label">Resumen</label>
                <input name="summary" defaultValue={editing?.summary ?? ""} className="gh-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="gh-label">Cuerpo (texto libre)</label>
                <textarea
                  name="body"
                  rows={6}
                  defaultValue={editing?.body ?? ""}
                  className="gh-input resize-y font-mono text-xs"
                />
              </div>
            </div>

            {/* Pasos */}
            <fieldset className="border-t border-base-700 pt-4">
              <legend className="gh-label">Pasos</legend>
              <div className="space-y-3">
                {(editingSteps.length ? editingSteps : [{ title: "", body: "", warning: null }]).map(
                  (s, i) => (
                    <div key={i} className="rounded-lg border border-base-700 bg-base-850 p-3">
                      <p className="mb-2 text-[11px] font-bold text-accent-300">Paso {i + 1}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          name="stepTitle"
                          defaultValue={s.title}
                          placeholder="Título del paso"
                          className="gh-input"
                        />
                        <input
                          name="stepWarning"
                          defaultValue={s.warning ?? ""}
                          placeholder="Aviso (perdible, online...) opcional"
                          className="gh-input"
                        />
                        <textarea
                          name="stepBody"
                          rows={2}
                          defaultValue={s.body}
                          placeholder="Qué hacer en este paso"
                          className="gh-input resize-y sm:col-span-2"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </fieldset>

            <div className="flex gap-2 border-t border-base-700 pt-4">
              <button type="submit" className="gh-btn gh-btn-primary text-xs">
                {editing ? "Guardar guía" : "Crear guía"}
              </button>
              <Link href="/admin/guias" className="gh-btn gh-btn-ghost text-xs">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      )}

      <div className="gh-card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-[13px]">
          <thead>
            <tr className="border-b border-base-700 text-[10px] uppercase tracking-wider text-base-500">
              <th className="px-4 py-2.5 font-bold">Guía</th>
              <th className="px-4 py-2.5 font-bold">Juego</th>
              <th className="px-4 py-2.5 font-bold">Tipo</th>
              <th className="px-4 py-2.5 font-bold">Pasos</th>
              <th className="px-4 py-2.5 font-bold">Estado</th>
              <th className="px-4 py-2.5 font-bold">Actualizada</th>
              <th className="px-4 py-2.5 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/60">
            {guides.map((g) => (
              <tr key={g.id} className="transition-colors hover:bg-base-850/50">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-base-100">{g.title}</p>
                  <p className="font-mono text-[10px] text-base-500">/guias/{g.slug}</p>
                </td>
                <td className="px-4 py-2.5 text-base-300">{g.gameTitle ?? "—"}</td>
                <td className="px-4 py-2.5 text-base-300">
                  {GUIDE_KIND_LABELS[g.kind as GuideKind] ?? g.kind}
                </td>
                <td className="px-4 py-2.5 font-mono text-base-200">{g.stepCount}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`gh-chip ${
                      g.status === "published"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-base-600 bg-base-800 text-base-400"
                    }`}
                  >
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-base-400">{formatDate(g.updatedAt)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <Link
                      href={`/admin/guias?edit=${g.id}`}
                      className="rounded-md p-1.5 text-base-400 hover:bg-base-700 hover:text-accent-300"
                      title="Editar"
                    >
                      <IconEdit size={14} />
                    </Link>
                    {g.gameSlug && (
                      <Link
                        href={`/guias/${g.slug}`}
                        className="rounded-md p-1.5 text-base-400 hover:bg-base-700 hover:text-accent-300"
                        title="Ver publicada"
                      >
                        <IconExternal size={14} />
                      </Link>
                    )}
                    <form action={removeGuide}>
                      <input type="hidden" name="id" value={g.id} />
                      <button
                        type="submit"
                        className="rounded-md p-1.5 text-base-400 hover:bg-rose-500/15 hover:text-rose-300"
                        title="Eliminar"
                      >
                        <IconTrash size={14} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
