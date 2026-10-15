import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icon";

/**
 * Paginación genérica que conserva los filtros de la URL actual.
 * Recibe la query ya normalizada (`q=tema&pagina=2`) y sólo cambia `pagina`.
 */
export function CommunityPagination({
  page,
  totalPages,
  total,
  query,
  label = "publicaciones",
}: {
  page: number;
  totalPages: number;
  total: number;
  query: Record<string, string | undefined>;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) p.set(k, v);
    }
    if (n > 1) p.set("pagina", String(n));
    const qs = p.toString();
    return qs ? `?${qs}` : "?";
  };

  const from = (page - 1) * 12 + 1;
  const to = Math.min(page * 12, total);

  const pages: (number | "gap")[] = [1];
  if (page > 3) pages.push("gap");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("gap");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <nav
      aria-label="Paginación de la comunidad"
      className="mt-8 flex flex-col items-center gap-3 border-t border-base-700/70 pt-6 sm:flex-row sm:justify-between"
    >
      <p className="text-xs text-base-500">
        Mostrando <span className="font-mono text-base-300">{from}</span>–
        <span className="font-mono text-base-300">{to}</span> de{" "}
        <span className="font-mono text-base-300">{total}</span> {label}
      </p>

      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} aria-label="Página anterior">
          <IconChevronLeft size={15} />
        </PageLink>

        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1.5 text-xs text-base-600">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg font-mono text-xs font-semibold transition-colors",
                p === page
                  ? "bg-accent-600 text-white"
                  : "text-base-400 hover:bg-base-800 hover:text-base-100",
              )}
            >
              {p}
            </Link>
          ),
        )}

        <PageLink href={href(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
          <IconChevronRight size={15} />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg text-base-600"
        {...rest}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid h-8 w-8 place-items-center rounded-lg text-base-400 transition-colors hover:bg-base-800 hover:text-base-100"
      {...rest}
    >
      {children}
    </Link>
  );
}