import Link from "next/link";
import { Alert, Chip } from "@/components/ui/primitives";
import { GUIDE_KIND_LABELS, type GuideKind } from "@/lib/constants";
import {
  IconBook,
  IconAlert,
  IconGlobe,
  IconRepeat,
  IconTarget,
  IconArrowRight,
  IconExternal,
  IconCheck,
} from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";

type Game = any;

export function GuideSection({ game }: { game: Game }) {
  const guide = game.guides?.[0];
  const steps = guide?.steps ?? [];

  if (!guide) {
    return (
      <section aria-labelledby="guia">
        <h2 id="guia" className="gh-section-title mb-3 flex items-center gap-2">
          <IconBook size={16} className="text-accent-400" />
          Guía del Platino
        </h2>
        <Alert tone="neutral" title="Guía pendiente">
          Todavía no hay una guía escrita para este juego.
        </Alert>
      </section>
    );
  }

  return (
    <section aria-labelledby="guia">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="guia" className="gh-section-title flex items-center gap-2">
            <IconBook size={16} className="text-accent-400" />
            Guía del Platino
          </h2>
          <p className="mt-0.5 text-xs text-base-400">{guide.summary}</p>
        </div>
        <Link href={`/guias/${guide.slug}`} className="gh-btn gh-btn-ghost text-xs">
          Abrir guía completa <IconArrowRight size={14} />
        </Link>
      </div>

      {steps.length > 0 && (
        <ol className="space-y-2.5">
          {steps.map((s: any) => (
            <li key={s.id} className="gh-card flex gap-3.5 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-600/20 font-mono text-xs font-black text-accent-300">
                {s.stepNumber}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-base-100">{s.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-base-300">{s.body}</p>
                {s.warning && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/[0.07] px-2.5 py-2 text-[12px] leading-relaxed text-rose-200">
                    <IconAlert size={13} className="mt-0.5 shrink-0" />
                    {s.warning}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-base-500">
        <Chip className="border-base-700 bg-base-850 text-base-400">
          {GUIDE_KIND_LABELS[(guide.kind as GuideKind) ?? "platino"]}
        </Chip>
        {guide.data_status && <span>Estado: {guide.data_status}</span>}
        {guide.publishedAt && <span>· Actualizada el {formatDate(guide.publishedAt)}</span>}
        {guide.authorDisplayName && <span>· por {guide.authorDisplayName}</span>}
      </div>

      {guide.sources?.length > 0 && (
        <div className="mt-3 rounded-xl border border-base-700 bg-base-850/60 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-base-400">
            Fuentes de esta guía
          </p>
          <ul className="mt-2 space-y-1.5">
            {guide.sources.map((src: any) => (
              <li key={src.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                <IconExternal size={12} className="text-base-500" />
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="gh-link"
                >
                  {src.sourceName}
                </a>
                {src.scope && <span className="text-base-500">· {src.scope}</span>}
                <span className="text-base-500">· confianza {src.confidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export { IconCheck, IconGlobe, IconRepeat, IconTarget };
