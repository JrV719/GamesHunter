"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconMenu,
  IconUser,
  IconLogout,
  IconSettings,
  IconTrophy,
} from "@/components/ui/Icon";

export type HeaderUser = {
  username: string;
  displayName: string | null;
  role: string;
} | null;

const NAV = [
  { href: "/juegos", label: "Catálogo" },
  { href: "/comparar", label: "Comparar" },
  { href: "/guias", label: "Guías" },
  { href: "/categorias", label: "Categorías" },
  { href: "/comunidad", label: "Comunidad" },
];

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-base-700/80 bg-base-900/85 backdrop-blur-xl">
      <div className="gh-container flex h-16 items-center gap-3">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Games Hunter">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 shadow-[0_6px_20px_-8px_rgb(56_189_248/.8)]">
            <IconTrophy size={19} className="text-white" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-tight text-base-100">
              Games<span className="text-accent-400">&nbsp;Hunter</span>
            </span>
            <span className="mt-0.5 hidden text-[10px] font-medium text-base-400 sm:block">
              Encuentra tu próximo platino
            </span>
          </span>
        </Link>

        {/*
          Nav de escritorio. `min-w-0` + `overflow-hidden` evitan que una
          etiqueta larga empuje el resto del encabezado hacia fuera.
        */}
        <nav
          className="ml-4 hidden min-w-0 items-center gap-1 overflow-hidden md:flex"
          aria-label="Principal"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-accent-600/15 text-accent-300"
                  : "text-base-300 hover:bg-base-800 hover:text-base-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/juegos"
            className="gh-btn gh-btn-ghost hidden whitespace-nowrap text-xs sm:inline-flex"
          >
            Buscar juego
          </Link>

          {user ? (
            // Los botones de cuenta solo caben en linea a partir de xl (1280px).
            // Por debajo, logotipo + nav + botones desbordaban la pagina hacia
            // la derecha; el menu desplegable cubre ese hueco.
            <div className="hidden items-center gap-1.5 xl:flex">
              {(user.role === "admin" || user.role === "moderator") && (
                <Link
                  href="/admin"
                  className="gh-btn gh-btn-ghost whitespace-nowrap text-xs"
                  title="Panel de administración"
                >
                  <IconSettings size={15} />
                  Admin
                </Link>
              )}
              <Link
                href="/perfil"
                className="gh-btn gh-btn-ghost max-w-[10rem] truncate whitespace-nowrap text-xs"
              >
                <IconUser size={15} />
                {user.displayName ?? user.username}
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 xl:flex">
              <Link href="/login" className="gh-btn gh-btn-ghost whitespace-nowrap text-xs">
                Entrar
              </Link>
              <Link
                href="/registro"
                className="gh-btn gh-btn-primary whitespace-nowrap text-xs"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Botón de menú: visible por debajo de xl */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="gh-btn gh-btn-ghost shrink-0 p-2 xl:hidden"
          >
            {open ? <IconMenu size={18} className="rotate-90" /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="border-t border-base-700 bg-base-900 xl:hidden">
          <nav className="gh-container flex flex-col gap-1 py-4" aria-label="Menú móvil">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive(item.href)
                    ? "bg-accent-600/15 text-accent-300"
                    : "text-base-300 hover:bg-base-800",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-base-700" />
            {user ? (
              <>
                <Link href="/perfil" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-base-300 hover:bg-base-800">
                  Mi perfil
                </Link>
                {(user.role === "admin" || user.role === "moderator") && (
                  <Link href="/admin" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-base-300 hover:bg-base-800">
                    Panel de administración
                  </Link>
                )}
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-base-300 hover:bg-base-800"
                  >
                    <IconLogout size={16} /> Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-base-300 hover:bg-base-800">
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="mt-1 rounded-lg bg-accent-600 px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
