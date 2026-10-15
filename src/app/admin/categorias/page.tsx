import { revalidatePath } from "next/cache";
import { all, run } from "@/lib/db";
import { newId } from "@/lib/queries/guides";
import { slugify } from "@/lib/utils";
import { IconPlus, IconTrash, IconEdit } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Administrar categorías", robots: { index: false } };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await all<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    gameCount: number;
  }>(
    `SELECT c.*, (SELECT COUNT(*) FROM game_categories gc WHERE gc.category_id = c.id) AS gameCount
       FROM categories c ORDER BY c.sort_order, c.name`,
  );

  async function createCategory(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    await run(
      "INSERT INTO categories (id, slug, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [
        newId("cat"),
        slugify(name),
        name,
        String(formData.get("description") ?? "").trim() || null,
        String(formData.get("icon") ?? "").trim() || null,
        Number(formData.get("sortOrder") ?? 50),
      ],
    );
    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
  }

  async function updateCategory(formData: FormData) {
    "use server";
    await requireAdmin();
    await run(
      "UPDATE categories SET name = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?",
      [
        String(formData.get("name") ?? "").trim(),
        String(formData.get("description") ?? "").trim() || null,
        String(formData.get("icon") ?? "").trim() || null,
        Number(formData.get("sortOrder") ?? 0),
        String(formData.get("id") ?? ""),
      ],
    );
    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    await requireAdmin();
    await run("DELETE FROM categories WHERE id = ?", [String(formData.get("id") ?? "")]);
    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
  }

  return (
    <div className="space-y-5">
      <div className="gh-card p-5">
        <h2 className="gh-section-title mb-3">Nueva categoría</h2>
        <form action={createCategory} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="gh-label">Nombre *</label>
            <input name="name" required className="gh-input" />
          </div>
          <div>
            <label className="gh-label">Descripción</label>
            <input name="description" className="gh-input" />
          </div>
          <div>
            <label className="gh-label">Icono</label>
            <input name="icon" className="gh-input" placeholder="swords" />
          </div>
          <div>
            <label className="gh-label">Orden</label>
            <input name="sortOrder" type="number" defaultValue={50} className="gh-input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3" />
          <div>
            <button type="submit" className="gh-btn gh-btn-primary w-full text-xs">
              <IconPlus size={14} /> Añadir
            </button>
          </div>
        </form>
      </div>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="gh-card p-3.5">
            <form action={updateCategory} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input type="hidden" name="id" value={c.id} />
              <div>
                <label className="gh-label">Nombre</label>
                <input name="name" defaultValue={c.name} className="gh-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="gh-label">Descripción</label>
                <input name="description" defaultValue={c.description ?? ""} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">Orden</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={c.sortOrder}
                  className="gh-input"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="gh-btn gh-btn-primary text-xs">
                  <IconEdit size={13} />
                </button>
              </div>
            </form>
            <div className="mt-2 flex items-center gap-3 border-t border-base-700 pt-2 text-[11px] text-base-500">
              <span>
                /categorias/{c.slug} · {c.gameCount} juego{c.gameCount === 1 ? "" : "s"}
              </span>
              <form action={deleteCategory} className="ml-auto">
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="gh-btn gh-btn-danger text-[11px]">
                  <IconTrash size={12} /> Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
