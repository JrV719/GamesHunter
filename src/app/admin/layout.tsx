import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { IconDatabase, IconGamepad } from "@/components/ui/Icon";

/** Protege todas las rutas /admin: exige rol admin o moderator. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?siguiente=/admin");
  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="gh-container py-16">
        <EmptyAccess />
      </div>
    );
  }

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
          Gestiona juegos, trofeos, guías, comunidad, fuentes, plataformas y categorías sin tocar el
          código.
        </p>
      </header>

      <AdminNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/juegos", label: "Juegos" },
  { href: "/admin/trofeos", label: "Trofeos" },
  { href: "/admin/guias", label: "Guías" },
  { href: "/admin/comunidad", label: "Comunidad" },
  { href: "/admin/fuentes", label: "Fuentes" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/plataformas", label: "Plataformas" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

function AdminNav() {
  return (
    <nav
      aria-label="Secciones del panel"
      className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
    >
      {NAV.map((n) => (
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
      <Link href="/" className="gh-btn gh-btn-ghost text-xs">
        Volver al inicio
      </Link>
    </div>
  );
}
