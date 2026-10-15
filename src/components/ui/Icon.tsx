import type { SVGProps } from "react";

/**
 * Set de iconos propio (SVG inline, sin dependencias externas).
 * Trazo de 1.75 para mantener legibilidad en tamaños pequeños.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const IconTrophy = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 5" />
    <path d="M17 6h2.5a2.5 2.5 0 0 1-2.5 5" />
    <path d="M10 14h4l.5 3h-5l.5-3Z" />
    <path d="M8 20h8" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconAlert = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4.5 21 19H3l9-14.5Z" />
    <path d="M12 10v4" />
    <path d="M12 16.5h.01" />
  </Base>
);

export const IconGlobe = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
  </Base>
);

export const IconGamepad = (p: IconProps) => (
  <Base {...p}>
    <path d="M7.5 8h9a4 4 0 0 1 3.9 3.1l1 3.4A2.6 2.6 0 0 1 18.7 18c-1 0-1.6-.5-2.2-1.1L15.4 15.5H8.6l-1.1 1.4c-.6.6-1.2 1.1-2.2 1.1a2.6 2.6 0 0 1-2.7-3.5l1-3.4A4 4 0 0 1 7.5 8Z" />
    <path d="M7 11v2.5M5.75 12.25h2.5" />
    <circle cx="15.5" cy="11.5" r=".9" fill="currentColor" />
    <circle cx="17.6" cy="13.4" r=".9" fill="currentColor" />
  </Base>
);

export const IconStar = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 4Z" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);

export const IconX = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Base>
);

export const IconChevronLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </Base>
);

export const IconFilter = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </Base>
);

export const IconSort = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 4v16" />
    <path d="m4 7 3-3 3 3" />
    <path d="M17 20V4" />
    <path d="m14 17 3 3 3-3" />
  </Base>
);

export const IconLayers = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 3.5 8.5 4.2-8.5 4.3-8.5-4.3L12 3.5Z" />
    <path d="m4 12 8 4 8-4" />
    <path d="m4 16.5 8 4 8-4" />
  </Base>
);

export const IconTag = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11.5V5a1 1 0 0 1 1-1h6.5L20 12.5 12.5 20 4 11.5Z" />
    <circle cx="8" cy="8" r="1.4" />
  </Base>
);

export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
  </Base>
);

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" />
    <path d="M18 14.8c1.9.8 3 2.4 3 4.2" />
  </Base>
);

export const IconDatabase = (p: IconProps) => (
  <Base {...p}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
    <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
  </Base>
);

export const IconBook = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 5.5A2 2 0 0 1 6 3.5h13v14H6a2 2 0 0 0-2 2v-14Z" />
    <path d="M4 19.5A2 2 0 0 0 6 21.5h13v-4" />
  </Base>
);

export const IconSettings = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M4.5 7.5 6.8 8.8M17.2 15.2l2.3 1.3M4.5 16.5l2.3-1.3M17.2 8.8l2.3-1.3" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4.5H6.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5H14" />
    <path d="M17 8.5 20.5 12 17 15.5" />
    <path d="M10.5 12h10" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconEdit = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 7h15" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Base>
);

export const IconExternal = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4.5h5.5V10" />
    <path d="m19.5 4.5-8 8" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Base>
);

export const IconInfo = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <path d="M12 7.8h.01" />
  </Base>
);

export const IconGauge = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="m12 13 3.5-3.5" />
    <circle cx="12" cy="17" r="1.3" fill="currentColor" />
  </Base>
);

export const IconFlame = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5s5 3.8 5 8.3A5 5 0 0 1 7 12c0-1.7.7-3 1.5-3.9C9.2 10 11 9.4 12 7.2c.7 1.5.6 3.3-.6 4.6 1.5-.4 2.6-1.8 2.6-3.2" />
    <path d="M9.5 20h5" />
  </Base>
);

export const IconTarget = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Base>
);

export const IconRepeat = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 9a5 5 0 0 1 5-5h7l-2.5-2.5M20 15a5 5 0 0 1-5 5H8l2.5 2.5" />
  </Base>
);

export const IconSparkle = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    <path d="M18.5 3.5v3M17 5h3" />
  </Base>
);

export const IconMenu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const IconBookmark = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z" />
  </Base>
);

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.5 18 12 8 18.5v-13Z" />
  </Base>
);

export const IconScale = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v16" />
    <path d="M6 8h12" />
    <path d="m6 8-2.5 6h5L6 8Z" />
    <path d="m18 8-2.5 6h5L18 8Z" />
    <path d="M8 20h8" />
  </Base>
);

export const IconGrid = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Base>
);

export const IconList = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Base>
);

export const IconTrend = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 16 5-5 3.5 3.5L20 7" />
    <path d="M15 7h5v5" />
  </Base>
);

export const IconLink = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </Base>
);

export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 19 6v5.5c0 4-2.9 7.6-7 9-4.1-1.4-7-5-7-9V6l7-2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);

export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Base>
);

export const IconMapPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

// ===========================================================================
// Iconos de la comunidad
// ===========================================================================

/** Hablar en general: foro. */
export const IconChat = (p: IconProps) => (
  <Base {...p}>
    <path d="M20.5 12.5c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.9-.4L4 20.5l1.6-3.9A6.6 6.6 0 0 1 3.5 12.5C3.5 8.6 7.3 5.5 12 5.5s8.5 3.1 8.5 7Z" />
  </Base>
);

/** Una sola línea de diálogo: comentario. */
export const IconMessage = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 5.5h16v11H9l-5 4v-15Z" />
    <path d="M8 9.5h8M8 13h5" />
  </Base>
);

/** Corazón: voto positivo. */
export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5-7.5 9.6-7.5 9.6Z" />
  </Base>
);

/** Chincheta: post fijado por un moderador. */
export const IconPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 4h6l-.7 5.2 2.7 2.6V14H7v-2.2l2.7-2.6L9 4Z" />
    <path d="M12 14v6" />
  </Base>
);

/** Bandera: denunciar. */
export const IconFlag = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 21V4.5" />
    <path d="M6 5.5h10.5l-1.7 3.5 1.7 3.5H6" />
  </Base>
);

/** Avión de papel: enviar. */
export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M20.5 3.5 3.5 10.2l7 2.8 2.8 7 7.2-16.5Z" />
  </Base>
);

/** Ojo: visitas. */
export const IconEye = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

/** Burbuja con interrogación: pregunta. */
export const IconQuestion = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5h16v9H12l-4.5 3.5v-3.5H4v-9Z" />
    <path d="M9.7 9.3a2.3 2.3 0 1 1 2.8 2.3v1" />
    <path d="M12.5 14.2h.01" />
  </Base>
);

/** Burbuja con estrella: opinión. */
export const IconQuote = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5h16v9H12l-4.5 3.5v-3.5H4v-9Z" />
    <path d="M9.5 9.5h5M9.5 12.3h3" />
  </Base>
);

/** Icono de trofeo por tipo: forma distinta para platino/oro/plata/bronce. */
export function TrophyIcon({ type, size = 18 }: { type: string; size?: number }) {
  const colors: Record<string, string> = {
    platinum: "text-slate-200",
    gold: "text-amber-300",
    silver: "text-slate-400",
    bronze: "text-orange-400",
  };
  if (type === "platinum") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colors.platinum}
        aria-hidden="true"
      >
        <path d="M8 3.5h8l-.6 4.2a3.4 3.4 0 0 1-6.8 0L8 3.5Z" />
        <path d="M8 5H5.2a2.4 2.4 0 0 0 2.4 4.6M16 5h2.8a2.4 2.4 0 0 1-2.4 4.6" />
        <path d="M11 11.2h2l.6 3.3h-3.2l.6-3.3Z" />
        <path d="M8 20.5h8M9.5 17.5h5l.7 3h-6.4l.7-3Z" />
      </svg>
    );
  }
  return <IconTrophy size={size} className={colors[type] ?? colors.bronze} />;
}
