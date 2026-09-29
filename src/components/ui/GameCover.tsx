import Image from "next/image";
import { cn } from "@/lib/utils";

/** Gradiente determinista a partir de un texto (para portadas generadas). */
function hashHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 360;
  }
  return h;
}

function initials(title: string) {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (words.length === 0) return title.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Portada del juego.
 * - Si hay `src` (imagen real) la muestra optimizada con next/image.
 * - Si no, genera una portada vectorial con el color de acento del juego.
 *   No usamos material con derechos: la portada generada es siemprePlaceholder.
 */
export function GameCover({
  src,
  alt,
  slug,
  title,
  accentColor = "#38bdf8",
  className,
  priority = false,
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px",
}: {
  src?: string | null;
  alt: string;
  slug: string;
  title: string;
  accentColor?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-base-850", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const hue = hashHue(slug);
  const hue2 = (hue + 48) % 360;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(150deg,
          hsl(${hue} 62% 26%) 0%,
          hsl(${hue2} 55% 17%) 45%,
          #0b0f14 100%)`,
      }}
      aria-label={alt}
      role="img"
    >
      {/* Halo del color de acento del juego */}
      <div
        className="absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl"
        style={{ background: accentColor, opacity: 0.28 }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,.5) 0 1px, transparent 1px 10px)",
        }}
      />
      <div className="gh-cover-grid absolute inset-0" />
      <div className="absolute inset-0 grid place-items-center">
        <span
          aria-hidden="true"
          className="font-mono text-[2.6rem] font-black tracking-tighter text-white/85"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,.6)" }}
        >
          {initials(title)}
        </span>
      </div>
      {/* Barra de acento inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: accentColor }} />
    </div>
  );
}
