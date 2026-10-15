import { cn } from "@/lib/utils";

/**
 * Renderiza el texto de una publicación o comentario.
 *
 * No se usa `dangerouslySetInnerHTML` con nada que venga del usuario: el texto
 * se parte en líneas y cada línea se convierte en un <p>. Así no hay forma de
 * inyectar etiquetas ni atributos, y no hace falta un parser de Markdown.
 * Los enlaces se reconocen y se abren de forma segura.
 */
export function RichBody({
  text,
  className,
  clamp = 0,
}: {
  text: string;
  className?: string;
  /** 0 = sin recorte. */
  clamp?: number;
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={cn(
            "whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-base-200",
            clamp > 0 && i >= clamp && "hidden",
          )}
        >
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

/** Convierte URLs en enlaces. Devuelve un array de strings y <a>. */
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const url = match[0];
    out.push(
      <a
        key={`l${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="gh-link break-all"
      >
        {url.length > 70 ? `${url.slice(0, 70)}…` : url}
      </a>,
    );
    last = match.index + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}