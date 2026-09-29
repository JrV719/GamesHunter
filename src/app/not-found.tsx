import Link from "next/link";
import { EmptyState } from "@/components/ui/primitives";
import { IconSearch } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="gh-container flex min-h-[60dvh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <p className="font-mono text-5xl font-black text-base-600">404</p>
        <h1 className="mt-3 text-xl font-black tracking-tight text-base-100">
          No hemos encontrado esta página
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-base-400">
          Puede que el juego no exista en la base de datos, que la ficha esté en borrador o que la
          URL tenga un error.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/juegos" className="gh-btn gh-btn-primary text-xs">
            <IconSearch size={14} /> Ir al catálogo
          </Link>
          <Link href="/" className="gh-btn gh-btn-ghost text-xs">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
