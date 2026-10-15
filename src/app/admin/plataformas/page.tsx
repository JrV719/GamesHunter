import { revalidatePath } from "next/cache";
import { all, run, one } from "@/lib/db";
import { newId } from "@/lib/queries/guides";
import { slugify } from "@/lib/utils";
import { IconPlus, IconTrash, IconEdit } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Administrar plataformas", robots: { index: false } };

export default async function AdminPlatformsPage() {
  await requireAdmin();
  const platforms = await all<{
    id: string;
    slug: string;
    name: string;
    shortName: string;
    sortOrder: number;
    gameCount: number;
  }>(
    `SELECT p.*, (SELECT COUNT(*) FROM game_platforms gp WHERE gp.platform_id = p.id) AS gameCount
       FROM platforms p ORDER BY p.sort_order, p.name`,
  );

  async function createPlatform(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    await run("INSERT INTO platforms (id, slug, name, short_name, sort_order) VALUES (?, ?, ?, ?, ?)", [
      newId("plat"),
      slugify(name),
      name,
      String(formData.get("shortName") ?? "").trim() || slugify(name).slice(0, 5).toUpperCase(),
      Number(formData.get("sortOrder") ?? 10),
    ]);
    revalidatePath("/admin/plataformas");
  }

  async function updatePlatform(formData: FormData) {
    "use server";
    await requireAdmin();
    await run(
      "UPDATE platforms SET name = ?, short_name = ?, sort_order = ? WHERE id = ?",
      [
        String(formData.get("name") ?? "").trim(),
        String(formData.get("shortName") ?? "").trim(),
        Number(formData.get("sortOrder") ?? 0),
        String(formData.get("id") ?? ""),
      ],
    );
    revalidatePath("/admin/plataformas");
  }

  async function deletePlatform(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const used = await one<{ n: number }>("SELECT COUNT(*) AS n FROM game_platforms WHERE platform_id = ?", [
      id,
    ]);
    if ((used?.n ?? 0) > 0) return;
    await run("DELETE FROM platforms WHERE id = ?", [id]);
    revalidatePath("/admin/plataformas");
  }

  return (
    <div className="space-y-5">
      <div className="gh-card p-5">
        <h2 className="gh-section-title mb-3">Nueva plataforma</h2>
        <form action={createPlatform} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="gh-label">Nombre *</label>
            <input name="name" required className="gh-input" placeholder="PlayStation 6" />
          </div>
          <div>
            <label className="gh-label">Abreviatura</label>
            <input name="shortName" className="gh-input" placeholder="PS6" />
          </div>
          <div>
            <label className="gh-label">Orden</label>
            <input name="sortOrder" type="number" defaultValue={10} className="gh-input" />
          </div>
          <div>
            <button type="submit" className="gh-btn gh-btn-primary w-full text-xs">
              <IconPlus size={14} /> Añadir
            </button>
          </div>
        </form>
      </div>

      <ul className="space-y-2">
        {platforms.map((p) => (
          <li key={p.id} className="gh-card p-3.5">
            <form action={updatePlatform} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={p.id} />
              <div>
                <label className="gh-label">Nombre</label>
                <input name="name" defaultValue={p.name} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">Abreviatura</label>
                <input name="shortName" defaultValue={p.shortName} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">Orden</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={p.sortOrder}
                  className="gh-input"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="gh-btn gh-btn-primary text-xs">
                  <IconEdit size={13} />
                </button>
                {p.gameCount === 0 && (
                  <button
                    type="submit"
                    formAction={deletePlatform}
                    name="id"
                    value={p.id}
                    className="gh-btn gh-btn-danger text-xs"
                  >
                    <IconTrash size={13} />
                  </button>
                )}
              </div>
            </form>
            <p className="mt-2 border-t border-base-700 pt-2 text-[11px] text-base-500">
              {p.gameCount} juego{p.gameCount === 1 ? "" : "s"} asociado
              {p.gameCount === 1 ? "" : "s"} · slug <code className="font-mono">{p.slug}</code>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
