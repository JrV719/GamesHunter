import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import Link from "next/link";
import { IconDatabase, IconGamepad, IconChat } from "@/components/ui/Icon";

/**
 * Protege todas las rutas /admin.
 *
 * El layout sólo decide qué puede VER una persona; cada página y cada Server
 * Action vuelven a comprobar el permiso con requireStaff()/requireAdmin().
 * El layout no es una frontera de seguridad: una Server Action es un endpoint
 * HTTP público y se puede invocar directamente.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?siguiente=/admin");

  const staff = isStaff(user);

  return (
    <div className="gh-container py-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <IconGamepad size={20} className="text-accent-400" />
          <h1 className="text-2xl font-black tracking-tight text-base-100">
            Panel de administración
          </h1>
          <span className="gh-chip border-base-600 bg-base-800 text-base-400 capitalize">
            {user.role}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-base-400">
          {staff ? (
            <>
              Gestiona juegos, trofeos, guías, comunidad, fuentes, plataformas y categorías sin tocar
              el código.
            </>
          ) : (
            "Esta zona es sólo para administradores y moderadores."
          )}
        </p>
      </header>

      <AdminNav role={staff ? (user.role === "admin" ? "admin" : "moderator") : "user"} />

      <div className="mt-6">{children}</div>
    </div>
  );
}

/**
 * Pestañas según el rol.
 *
 * `moderator` sólo entra a la moderación de la comunidad: no gestiona juegos,
 * guías ni usuarios. Es la misma regla que aplican las páginas.
 */
const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/juegos", label: "Juegos" },
    { href: "/admin/trofeos", label: "Trofeos" },
    { href: "/admin/guias", label: "Guías" },
    { href: "/admin/comunidad", label: "Comunidad" },
    { href: "/admin/fuentes", label: "Fuentes" },
    { href: "/admin/categorias", label: "Categorías" },
    { href: "/admin/plataformas", label: "Plataformas" },
    { href: "/admin/usuarios", label: "Usuarios" },
  ],
  moderator: [
    { href: "/admin/comunidad", label: "Comunidad" },
    { href: "/admin/usuarios", label: "Usuarios (lectura)" },
  ],
  user: [],
};

function AdminNav({ role }: { role: string }) {
  const items = NAV_BY_ROLE[role] ?? [];
  if (items.length === 0) {
    return <EmptyAccess />;
  }

  return (
    <nav
      aria-label="Secciones del panel"
      className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
    >
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="shrink-0 rounded-lg border border-base-700 bg-base-800 px-3 py-1.5 text-xs font-semibold text-base-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

function EmptyAccess() {
  return (
    <div className="gh-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <IconDatabase size={26} className="text-base-500" />
      <h2 className="text-base font-semibold text-base-100">Acceso restringido</h2>
      <p className="max-w-md text-sm text-base-400">
        Tu cuenta no tiene permisos de administración. Si crees que es un error, pide a un
        administrador que cambie tu rol desde la sección de usuarios.
      </p>
      <div className="flex gap-2">
        <Link href="/" className="gh-btn gh-btn-ghost text-xs">
          Volver al inicio
        </Link>
        <Link href="/comunidad" className="gh-btn gh-btn-ghost text-xs">
          <IconChat size={13} /> Ir a la comunidad
        </Link>
      </div>
    </div>
  );
}