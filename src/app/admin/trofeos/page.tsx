import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { all, one, run, runMany } from "@/lib/db";
import { newId } from "@/lib/queries/guides";
import { getSources } from "@/lib/queries/taxonomy";
import { TROPHY_TYPES, TROPHY_TYPE_LABELS, type TrophyType } from "@/lib/constants";
import { IconPlus, IconTrash, IconSearch } from "@/components/ui/Icon";

export const metadata = { title: "Administrar trofeos", robots: { index: false } };

type SearchParams = Promise<{ juego?: string; q?: string }>;

export default async function AdminTrophiesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sources = await getSources();

  const games = all<{ id: string; title: string; slug: string; trophyCount: number }>(
    `SELECT g.id, g.title, g.slug,
            (SELECT COUNT(*) FROM trophies t WHERE t.game_id = g.id) AS trophyCount
       FROM games g ORDER BY g.title`,
  );

  const selectedGame = sp.juego ?? games[0]?.id ?? null;
  const q = (sp.q ?? "").trim();

  const trophies = selectedGame
    ? q
      ? all<Row>(
          `SELECT gt.id, t.name, t.type, gt.how_to AS howTo, gt.difficulty,
                  gt.is_missable AS isMissable, gt.is_online AS isOnline, gt.sort_order AS sortOrder,
                  gt.recommended_stage AS recommendedStage, gt.requires_difficulty AS requiresDifficulty
             FROM game_trophies gt JOIN trophies t ON t.id = gt.trophy_id
            WHERE gt.game_id = ? AND t.name LIKE ? ORDER BY gt.sort_order LIMIT 100`,
          [selectedGame, `%${q}%`],
        )
      : all<Row>(
          `SELECT gt.id, t.name, t.type, gt.how_to AS howTo, gt.difficulty,
                  gt.is_missable AS isMissable, gt.is_online AS isOnline, gt.sort_order AS sortOrder,
                  gt.recommended_stage AS recommendedStage, gt.requires_difficulty AS requiresDifficulty
             FROM game_trophies gt JOIN trophies t ON t.id = gt.trophy_id
            WHERE gt.game_id = ? ORDER BY gt.sort_order LIMIT 100`,
          [selectedGame],
        )
    : [];

  async function addTrophy(formData: FormData) {
    "use server";
    const gameId = String(formData.get("gameId") ?? "");
    const listId = one<{ id: string }>(
      "SELECT id FROM trophy_lists WHERE game_id = ? ORDER BY is_default DESC LIMIT 1",
      [gameId],
    )?.id;
    if (!listId) redirect("/admin/trofeos?juego=" + gameId + "&error=El+juego+no+tiene+lista");

    const name = String(formData.get("name") ?? "").trim();
    if (!name) redirect("/admin/trofeos?juego=" + gameId + "&error=Nombre+obligatorio");
    const type = String(formData.get("type") ?? "bronze") as TrophyType;
    const maxOrder =
      one<{ n: number }>("SELECT COALESCE(MAX(sort_order), -1) AS n FROM game_trophies WHERE trophy_list_id = ?", [
        listId,
      ])?.n ?? -1;

    const trophyId = newId("trophy");
    runMany([
      {
        sql: `INSERT INTO trophies (id, slug, name, type, official_description, game_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          trophyId,
          `${gameId}--${slug(name)}`,
          name,
          type,
          String(formData.get("officialDescription") ?? "").trim() || null,
          gameId,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      },
      {
        sql: `INSERT INTO game_trophies (id, game_id, trophy_list_id, trophy_id, sort_order, how_to,
                difficulty, is_missable, is_online, recommended_stage, requires_difficulty, is_dlc, source_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          newId("gt"),
          gameId,
          listId,
          trophyId,
          maxOrder + 1,
          String(formData.get("howTo") ?? "").trim(),
          Number(formData.get("difficulty") ?? 3),
          formData.get("isMissable") ? 1 : 0,
          formData.get("isOnline") ? 1 : 0,
          String(formData.get("recommendedStage") ?? "Cualquier momento").trim(),
          String(formData.get("requiresDifficulty") ?? "").trim() || null,
          formData.get("isDLC") ? 1 : 0,
          String(formData.get("sourceId") ?? "") || null,
        ],
      },
    ]);

    revalidatePath("/admin/trofeos");
    redirect(`/admin/trofeos?juego=${gameId}&guardado=1`);
  }

  async function updateTrophy(formData: FormData) {
    "use server";
    const gtId = String(formData.get("gtId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    run(
      `UPDATE game_trophies SET how_to = ?, difficulty = ?, is_missable = ?, is_online = ?,
              recommended_stage = ?, requires_difficulty = ?, is_dlc = ? WHERE id = ?`,
      [
        String(formData.get("howTo") ?? "").trim(),
        Number(formData.get("difficulty") ?? 3),
        formData.get("isMissable") ? 1 : 0,
        formData.get("isOnline") ? 1 : 0,
        String(formData.get("recommendedStage") ?? "Cualquier momento").trim(),
        String(formData.get("requiresDifficulty") ?? "").trim() || null,
        formData.get("isDLC") ? 1 : 0,
        gtId,
      ],
    );
    run("UPDATE trophies SET name = ?, updated_at = ? WHERE id = (SELECT trophy_id FROM game_trophies WHERE id = ?)", [
      name,
      new Date().toISOString(),
      gtId,
    ]);
    const gameId = String(formData.get("gameId") ?? "");
    revalidatePath("/admin/trofeos");
    revalidatePath("/juegos");
    redirect(`/admin/trofeos?juego=${gameId}&guardado=1`);
  }

  async function deleteTrophy(formData: FormData) {
    "use server";
    const gtId = String(formData.get("gtId") ?? "");
    const gameId = String(formData.get("gameId") ?? "");
    run("DELETE FROM game_trophies WHERE id = ?", [gtId]);
    run("DELETE FROM trophies WHERE id = (SELECT trophy_id FROM game_trophies WHERE id = ?)", [gtId]);
    revalidatePath("/admin/trofeos");
    redirect(`/admin/trofeos?juego=${gameId}&borrado=1`);
  }

  return (
    <div className="space-y-5">
      {/* Selector de juego */}
      <form action="/admin/trofeos" method="get" className="flex flex-wrap items-center gap-2">
        <select name="juego" defaultValue={selectedGame ?? ""} className="gh-input w-auto min-w-56">
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title} ({g.trophyCount})
            </option>
          ))}
        </select>
        <div className="relative flex-1 min-w-48">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-400"
          />
          <input name="q" defaultValue={q} placeholder="Buscar trofeo..." className="gh-input pl-9" />
        </div>
        <button type="submit" className="gh-btn gh-btn-ghost text-xs">
          Filtrar
        </button>
      </form>

      {selectedGame && (
        <>
          {/* Añadir trofeo */}
          <div className="gh-card p-5">
            <h2 className="gh-section-title mb-3">Añadir trofeo</h2>
            <form action={addTrophy} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="gameId" value={selectedGame} />
              <div className="lg:col-span-2">
                <label className="gh-label">Nombre *</label>
                <input name="name" required className="gh-input" placeholder="Maestro cazador" />
              </div>
              <div>
                <label className="gh-label">Tipo</label>
                <select name="type" className="gh-input">
                  {TROPHY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TROPHY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="gh-label">Dificultad (1-10)</label>
                <input
                  name="difficulty"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={3}
                  className="gh-input"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="gh-label">Cómo conseguirlo (texto propio)</label>
                <input name="howTo" className="gh-input" placeholder="Resume el método aquí." />
              </div>
              <div>
                <label className="gh-label">Momento recomendado</label>
                <input
                  name="recommendedStage"
                  className="gh-input"
                  defaultValue="Cualquier momento"
                />
              </div>
              <div>
                <label className="gh-label">Dificultad requerida</label>
                <input name="requiresDifficulty" className="gh-input" placeholder="Difícil" />
              </div>
              <div className="lg:col-span-2">
                <label className="gh-label">Descripción oficial (opcional)</label>
                <input
                  name="officialDescription"
                  className="gh-input"
                  placeholder="Texto de la ficha de trofeo de PlayStation"
                />
              </div>
              <div>
                <label className="gh-label">Fuente</label>
                <select name="sourceId" className="gh-input">
                  <option value="">Sin fuente</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-4 pb-1">
                {(
                  [
                    ["isMissable", "Perdible"],
                    ["isOnline", "Online"],
                    ["isDLC", "DLC"],
                  ] as const
                ).map(([name, label]) => (
                  <label key={name} className="flex items-center gap-1.5 text-[12px] text-base-300">
                    <input type="checkbox" name={name} className="accent-[var(--color-accent-500)]" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex items-end">
                <button type="submit" className="gh-btn gh-btn-primary w-full text-xs">
                  <IconPlus size={14} /> Añadir
                </button>
              </div>
            </form>
          </div>

          {/* Listado editable */}
          <div className="space-y-2">
            {trophies.length === 0 && (
              <p className="gh-card px-4 py-8 text-center text-sm text-base-500">
                No hay trofeos para este juego todavía.
              </p>
            )}
            {trophies.map((t) => (
              <details key={t.id} className="gh-card overflow-hidden">
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-base-850">
                  <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-base-400">
                    {TROPHY_TYPE_LABELS[t.type as TrophyType] ?? t.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-base-100">
                    {t.name}
                  </span>
                  {t.isMissable ? (
                    <span className="gh-chip border-rose-500/30 bg-rose-500/10 text-rose-300">
                      Perdible
                    </span>
                  ) : null}
                  {t.isOnline ? (
                    <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-accent-300">
                      Online
                    </span>
                  ) : null}
                  <span className="font-mono text-xs text-base-400">{t.difficulty}/10</span>
                </summary>
                <div className="border-t border-base-700 p-4">
                  <form action={updateTrophy} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="gtId" value={t.id} />
                    <input type="hidden" name="gameId" value={selectedGame} />
                    <div>
                      <label className="gh-label">Nombre</label>
                      <input name="name" defaultValue={t.name} className="gh-input" />
                    </div>
                    <div>
                      <label className="gh-label">Dificultad (1-10)</label>
                      <input
                        name="difficulty"
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={t.difficulty}
                        className="gh-input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="gh-label">Cómo conseguirlo</label>
                      <textarea
                        name="howTo"
                        rows={2}
                        defaultValue={t.howTo}
                        className="gh-input resize-y"
                      />
                    </div>
                    <div>
                      <label className="gh-label">Momento recomendado</label>
                      <input
                        name="recommendedStage"
                        defaultValue={t.recommendedStage}
                        className="gh-input"
                      />
                    </div>
                    <div>
                      <label className="gh-label">Dificultad requerida</label>
                      <input
                        name="requiresDifficulty"
                        defaultValue={t.requiresDifficulty ?? ""}
                        className="gh-input"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      {(
                        [
                          ["isMissable", "Perdible", t.isMissable],
                          ["isOnline", "Online", t.isOnline],
                        ] as const
                      ).map(([name, label, checked]) => (
                        <label key={name} className="flex items-center gap-1.5 text-[12px] text-base-300">
                          <input
                            type="checkbox"
                            name={name}
                            defaultChecked={Boolean(checked)}
                            className="accent-[var(--color-accent-500)]"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                      <button type="submit" className="gh-btn gh-btn-primary text-xs">
                        Guardar
                      </button>
                    </div>
                  </form>
                  <form action={deleteTrophy} className="mt-2 flex justify-end">
                    <input type="hidden" name="gtId" value={t.id} />
                    <input type="hidden" name="gameId" value={selectedGame} />
                    <button type="submit" className="gh-btn gh-btn-danger text-xs">
                      <IconTrash size={13} /> Eliminar trofeo
                    </button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Row = {
  id: string;
  name: string;
  type: string;
  howTo: string;
  difficulty: number;
  isMissable: number;
  isOnline: number;
  recommendedStage: string;
  requiresDifficulty: string | null;
};

function slug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
