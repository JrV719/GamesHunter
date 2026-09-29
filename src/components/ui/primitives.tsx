import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DATA_STATUS_META, type DataStatus } from "@/lib/constants";
import { IconInfo } from "@/components/ui/Icon";

// ----------------------------------------------------------------------------
// Chip / badge genérico
// ----------------------------------------------------------------------------

export function Chip({
  children,
  className,
  icon,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <span className={cn("gh-chip", className)} title={title}>
      {icon}
      {children}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Estado del dato: verificado / provisional / demo
// ----------------------------------------------------------------------------

export function DataStatusBadge({
  status,
  withTooltip = true,
  className,
}: {
  status: DataStatus | string;
  withTooltip?: boolean;
  className?: string;
}) {
  const meta = DATA_STATUS_META[status as DataStatus] ?? DATA_STATUS_META.provisional;
  return (
    <span
      className={cn("gh-chip", meta.className, className)}
      title={withTooltip ? meta.description : undefined}
    >
      {withTooltip && <IconInfo size={12} />}
      {meta.label}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Barra de dificultad 1..10
// ----------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-emerald-500",
  3: "bg-teal-500",
  4: "bg-teal-500",
  5: "bg-sky-500",
  6: "bg-amber-500",
  7: "bg-amber-500",
  8: "bg-orange-500",
  9: "bg-rose-500",
  10: "bg-rose-500",
};

const DIFFICULTY_TEXT: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-emerald-400",
  3: "text-teal-400",
  4: "text-teal-400",
  5: "text-sky-400",
  6: "text-amber-400",
  7: "text-amber-400",
  8: "text-orange-400",
  9: "text-rose-400",
  10: "text-rose-400",
};

export function difficultyColor(score: number) {
  return DIFFICULTY_COLORS[Math.min(10, Math.max(1, score))] ?? "bg-sky-500";
}

export function difficultyTextColor(score: number) {
  return DIFFICULTY_TEXT[Math.min(10, Math.max(1, score))] ?? "text-sky-400";
}

export function difficultyLabel(score: number): string {
  if (score <= 2) return "Muy fácil";
  if (score <= 4) return "Fácil";
  if (score <= 6) return "Media";
  if (score <= 8) return "Difícil";
  return "Muy difícil";
}

export function DifficultyBar({
  score,
  label,
  compact = false,
  showValue = true,
}: {
  score: number | null | undefined;
  label?: string;
  compact?: boolean;
  showValue?: boolean;
}) {
  if (score == null) {
    return <span className="text-xs text-base-400">Sin datos</span>;
  }
  const pct = (score / 10) * 100;
  return (
    <div className={cn("w-full", compact ? "" : "space-y-1")}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <span className="text-xs text-base-300">{label}</span>}
          {showValue && (
            <span
              className={cn(
                "font-mono text-xs font-bold tabular-nums",
                difficultyTextColor(score),
              )}
            >
              {score}/10
            </span>
          )}
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-base-700"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-label={label ? `${label}: ${score} de 10` : `Dificultad ${score} de 10`}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", difficultyColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Meter de 0..100 (progreso de la historia, porcentaje de platino)
// ----------------------------------------------------------------------------

export function Meter({
  value,
  max = 100,
  className,
  barClassName = "bg-accent-500",
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-base-700", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Fila etiqueta/valor de la ficha
// ----------------------------------------------------------------------------

export function DataRow({
  label,
  value,
  icon,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-base-700/60 py-2 last:border-0",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-base-400">
        {icon}
        {label}
      </span>
      <span className={cn("text-right text-sm font-medium text-base-100", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Avisos destacados: perdibles, online, dificultad, múltiples partidas
// ----------------------------------------------------------------------------

const ALERT_TONES = {
  danger: "border-rose-500/30 bg-rose-500/[0.07] text-rose-200",
  warn: "border-amber-500/30 bg-amber-500/[0.07] text-amber-200",
  info: "border-accent-500/30 bg-accent-500/[0.07] text-accent-300",
  neutral: "border-base-600 bg-base-800/60 text-base-200",
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  icon,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3.5", ALERT_TONES[tone], className)}>
      <div className="flex items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold tracking-tight">{title}</p>
          {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Estados vacíos y títulos de sección
// ----------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="gh-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && <div className="text-base-500">{icon}</div>}
      <h3 className="text-base font-semibold text-base-100">{title}</h3>
      {description && <p className="max-w-md text-sm text-base-400">{description}</p>}
      {action}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  href,
  hrefLabel = "Ver todo",
  icon,
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="gh-section-title flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-base-400">{description}</p>}
      </div>
      {action ??
        (href && (
          <a
            href={href}
            className="gh-link shrink-0 text-xs font-semibold hover:underline"
          >
            {hrefLabel} →
          </a>
        ))}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            active === t.id
              ? "bg-accent-600/20 text-accent-300 ring-1 ring-accent-500/40"
              : "text-base-400 hover:bg-base-800 hover:text-base-200",
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 opacity-60">{t.count}</span>}
        </a>
      ))}
    </div>
  );
}
