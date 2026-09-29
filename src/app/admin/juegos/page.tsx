import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { all, one, run, runMany, type SqlParam } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { newId } from "@/lib/queries/guides";
import { getPlatforms, getCategories, getDevelopers } from "@/lib/queries/taxonomy";
import { IconPlus, IconSearch, IconEdit, IconTrash } from "@/components/ui/Icon";
import { GameForm } from "@/components/admin/GameForm";

export const metadata = { title: "Administrar juegos", robots: { index: false } };

type SearchParams = Promise<{ q?: string; nuevo?: string; edit?: string }>;

export default async function AdminGamesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const games = q
    ? all<{
        id: string;
        slug: string;
        title: string;
        status: string;
        dataStatus: string;
        developerName: string;
        totalTrophies: number | null;
        difficulty: number | null;
        updatedAt: string;
      }>(
        `SELECT g.id, g.slug, g.title, g.status, g.data_status AS dataStatus,
                d.name AS developerName, g.updated_at AS updatedAt,
                pp.total_trophies AS totalTrophies,
                (SELECT dr.score FROM difficulty_ratings dr
                  WHERE dr.game_id = g.id AND dr.kind = 'platinum' ORDER BY dr.sort_order LIMIT 1) AS difficulty
           FROM games g JOIN developers d ON d.id = g.developer_id
           LEFT JOIN platinum_profiles pp ON pp.game_id = g.id
          WHERE g.title LIKE ? OR g.slug LIKE ?
          ORDER BY g.title LIMIT 100`,
        [`%${q}%`, `%${q}%`],
      )
    : all<{
        id: string;
        slug: string;
        title: string;
        status: string;
        dataStatus: string;
        developerName: string;
        totalTrophies: number | null;
        difficulty: number | null;
        updatedAt: string;
      }>(
        `SELECT g.id, g.slug, g.title, g.status, g.data_status AS dataStatus,
                d.name AS developerName, g.updated_at AS updatedAt,
                pp.total_trophies AS totalTrophies,
                (SELECT dr.score FROM difficulty_ratings dr
                  WHERE dr.game_id = g.id AND dr.kind = 'platinum' ORDER BY dr.sort_order LIMIT 1) AS difficulty
           FROM games g JOIN developers d ON d.id = g.developer_id
           LEFT JOIN platinum_profiles pp ON pp.game_id = g.id
          ORDER BY g.title LIMIT 100`,
      );

  const platforms = await getPlatforms();
  const categories = await getCategories();
  const developers = await getDevelopers();

  // --- Crear juego
  async function createGame(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "").trim();
    if (!title) redirect("/admin/juegos?nuevo=1&error=Titulo+obligatorio");
    const slug = await uniqueGameSlug(title);

    const developerId = String(formData.get("developerId") ?? "");
    const releaseDate = String(formData.get("releaseDate") ?? "");
    const summary = String(formData.get("summary") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const platformIds = formData.getAll("platformIds").map(String);
    const categoryIds = formData.getAll("categoryIds").map(String);

    const searchText = [
      title,
      summary,
      developers.find((d) => d.id === developerId)?.name ?? "",
      categoryIds.map((id) => categories.find((c) => c.id === id)?.slug ?? "").join(" "),
    ]
      .join(" | ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const id = newId("game");
    const now = new Date().toISOString();
    runMany([
      {
        sql: `INSERT INTO games (id, slug, title, tagline, summary, description, developer_id,
                release_date, accent_color, data_status, status, search_text, created_at, updated_at)
              VALUES (?, ?, ?, NULL, ?, ?, ?, ?, '#38bdf8', ?, 'draft', ?, ?, ?)`,
        params: [
          id,
          slug,
          title,
          summary || "Sin resumen.",
          description || summary || "Sin descripcion.",
          developerId,
          releaseDate ? new Date(releaseDate).toISOString() : null,
          String(formData.get("dataStatus") ?? "provisional"),
          searchText,
          now,
          now,
        ],
      },
      ...platformIds.map((pid) => ({
        sql: `INSERT INTO game_platforms (id, game_id, platform_id, shares_trophy_list, notes)
              VALUES (?, ?, ?, 1, NULL)`,
        params: [newId("gp"), id, pid],
      })),
      ...categoryIds.map((cid, i) => ({
        sql: "INSERT INTO game_categories (game_id, category_id, is_primary) VALUES (?, ?, ?)",
        params: [id, cid, i === 0 ? 1 : 0],
      })),
      {
        sql: `INSERT INTO platinum_profiles (game_id, total_trophies, platinum_count)
              VALUES (?, 0, 0)`,
        params: [id],
      },
    ]);

    revalidatePath("/admin/juegos");
    revalidatePath("/juegos");
    revalidatePath(`/juegos/${slug}`);
    revalidatePath("/sitemap.xml");
    redirect(`/admin/juegos?edit=${id}&nuevo=1`);
  }

  // --- Actualizar juego
  async function updateGame(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const developerId = String(formData.get("developerId") ?? "");
    const releaseDate = String(formData.get("releaseDate") ?? "");
    const platformIds = formData.getAll("platformIds").map(String);
    const categoryIds = formData.getAll("categoryIds").map(String);

    const devName = developers.find((d) => d.id === developerId)?.name ?? "";
    const current = one<{ summary: string; status: string; dataStatus: string; slug: string }>(
      "SELECT summary, status, data_status AS dataStatus, slug FROM games WHERE id = ?",
      [id],
    );
    if (!current) redirect("/admin/juegos");

    const searchText = [
      title,
      current?.summary ?? "",
      devName,
      categoryIds.map((cid) => categories.find((c) => c.id === cid)?.slug ?? "").join(" "),
    ]
      .join(" | ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const stmts: { sql: string; params?: SqlParam[] }[] = [
      {
        sql: `UPDATE games SET title = ?, developer_id = ?, release_date = ?,
                data_status = ?, status = ?, search_text = ?, updated_at = ? WHERE id = ?`,
        params: [
          title,
          developerId,
          releaseDate ? new Date(releaseDate).toISOString() : null,
          String(formData.get("dataStatus") ?? "provisional"),
          String(formData.get("status") ?? "draft"),
          searchText,
          new Date().toISOString(),
          id,
        ],
      },
      { sql: "DELETE FROM game_platforms WHERE game_id = ?", params: [id] },
      { sql: "DELETE FROM game_categories WHERE game_id = ?", params: [id] },
      ...platformIds.map((pid) => ({
        sql: "INSERT INTO game_platforms (id, game_id, platform_id, shares_trophy_list, notes) VALUES (?, ?, ?, 1, NULL)",
        params: [newId("gp"), id, pid],
      })),
      ...categoryIds.map((cid, i) => ({
        sql: "INSERT INTO game_categories (game_id, category_id, is_primary) VALUES (?, ?, ?)",
        params: [id, cid, i === 0 ? 1 : 0],
      })),
    ];
    runMany(stmts);

    revalidatePath("/admin/juegos");
    revalidatePath(`/juegos/${current.slug}`);
    revalidatePath("/juegos");
    revalidatePath("/sitemap.xml");
    redirect("/admin/juegos?edit=" + id + "&guardado=1");
  }

  // --- Borrar juego
  async function deleteGame(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    run("DELETE FROM games WHERE id = ?", [id]);
    revalidatePath("/admin/juegos");
    revalidatePath("/juegos");
    redirect("/admin/juegos?borrado=1");
  }

  const editing = sp.edit
    ? one<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        developerId: string;
        releaseDate: string | null;
        status: string;
        dataStatus: string;
        platformIds: string;
        categoryIds: string;
      }>(
        `SELECT g.id, g.title, g.slug, g.summary, g.developer_id AS developerId,
                g.release_date AS releaseDate, g.status, g.data_status AS dataStatus,
                (SELECT json_group_array(platform_id) FROM game_platforms WHERE game_id = g.id) AS platformIds,
                (SELECT json_group_array(category_id) FROM game_categories WHERE game_id = g.id) AS categoryIds
           FROM games g WHERE g.id = ?`,
        [sp.edit],
      )
    : null;

  const editingPlatforms: string[] = editing?.platformIds ? JSON.parse(editing.platformIds) : [];
  const editingCategories: string[] = editing?.categoryIds ? JSON.parse(editing.categoryIds) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-1 items-center gap-2" action="/admin/juegos" method="get">
          <div className="relative flex-1">
            <IconSearch
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-400"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar juego por nombre o slug..."
              className="gh-input pl-9"
            />
          </div>
          <button type="submit" className="gh-btn gh-btn-ghost text-xs">
            Buscar
          </button>
        </form>
        <a href="/admin/juegos?nuevo=1" className="gh-btn gh-btn-primary text-xs">
          <IconPlus size={14} /> Nuevo juego
        </a>
      </div>

      {sp.nuevo && !editing && (
        <div className="gh-card p-5">
          <h2 className="gh-section-title mb-3">Crear videojuego</h2>
          <GameForm
            platforms={platforms}
            categories={categories}
            developers={developers}
            action={createGame}
          />
        </div>
      )}

      {editing && (
        <div className="gh-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="gh-section-title">Editar: {editing.title}</h2>
            <div className="flex gap-2">
              <a href={`/juegos/${editing.slug}`} className="gh-btn gh-btn-ghost text-xs">
                Ver ficha pública
              </a>
              <a href="/admin/juegos" className="gh-btn gh-btn-ghost text-xs">
                Cerrar
              </a>
            </div>
          </div>
          <GameForm
            platforms={platforms}
            categories={categories}
            developers={developers}
            action={updateGame}
            defaults={{
              id: editing.id,
              title: editing.title,
              summary: editing.summary,
              developerId: editing.developerId,
              releaseDate: editing.releaseDate ? editing.releaseDate.slice(0, 10) : "",
              status: editing.status,
              dataStatus: editing.dataStatus,
              platformIds: editingPlatforms,
              categoryIds: editingCategories,
            }}
            deleteAction={deleteGame}
          />
        </div>
      )}

      <div className="gh-card overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-[13px]">
          <thead>
            <tr className="border-b border-base-700 text-[10px] uppercase tracking-wider text-base-500">
              <th className="px-4 py-2.5 font-bold">Juego</th>
              <th className="px-4 py-2.5 font-bold">Desarrolladora</th>
              <th className="px-4 py-2.5 font-bold">Platino</th>
              <th className="px-4 py-2.5 font-bold">Trofeos</th>
              <th className="px-4 py-2.5 font-bold">Estado</th>
              <th className="px-4 py-2.5 font-bold">Dato</th>
              <th className="px-4 py-2.5 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/60">
            {games.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-base-500">
                  No hay juegos{q ? ` para «${q}»` : ""}.
                </td>
              </tr>
            )}
            {games.map((g) => (
              <tr key={g.id} className="transition-colors hover:bg-base-850/50">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-base-100">{g.title}</p>
                  <p className="font-mono text-[10px] text-base-500">/juegos/{g.slug}</p>
                </td>
                <td className="px-4 py-2.5 text-base-300">{g.developerName}</td>
                <td className="px-4 py-2.5 font-mono text-base-200">
                  {g.difficulty != null ? `${g.difficulty}/10` : "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-base-200">{g.totalTrophies ?? "—"}</td>
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
                <td className="px-4 py-2.5 text-[11px] text-base-400">{g.dataStatus}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <a
                      href={`/admin/juegos?edit=${g.id}`}
                      className="rounded-md p-1.5 text-base-400 transition-colors hover:bg-base-700 hover:text-accent-300"
                      title="Editar"
                    >
                      <IconEdit size={14} />
                    </a>
                    <Link
                      href={`/admin/trofeos?juego=${g.id}`}
                      className="rounded-md p-1.5 text-base-400 transition-colors hover:bg-base-700 hover:text-accent-300"
                      title="Trofeos"
                    >
                      <IconTrophyMini />
                    </Link>
                    <form action={deleteGame}>
                      <input type="hidden" name="id" value={g.id} />
                      <button
                        type="submit"
                        className="rounded-md p-1.5 text-base-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
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

function IconTrophyMini() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M10 14h4l.5 3h-5l.5-3ZM8 20h8" />
    </svg>
  );
}

async function uniqueGameSlug(title: string) {
  const root = slugify(title) || "juego";
  let candidate = root;
  let i = 2;
  for (;;) {
    const exists = one<{ id: string }>("SELECT id FROM games WHERE slug = ?", [candidate]);
    if (!exists) return candidate;
    candidate = `${root}-${i++}`;
  }
}
