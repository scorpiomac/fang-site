import { useId, useState, type ReactNode } from "react";
import { getArchetypeMeaning } from "@/content/characterProfiles";

type Props = {
  term: string;
  children?: ReactNode;
  className?: string;
  /** Focus clavier sur le mot (ex. titres hors lien). Éviter dans un <a>/<button>. */
  focusable?: boolean;
};

/**
 * Affiche un nom d’archétype ; au survol / focus, la signification française
 * apparaît juste sous le mot.
 */
export function GlossedTerm({ term, children, className = "", focusable = false }: Props) {
  const meaning = getArchetypeMeaning(term);
  const hintId = useId();
  const [open, setOpen] = useState(false);

  if (!meaning) {
    return <span className={className || undefined}>{children ?? term}</span>;
  }

  return (
    <span
      className={`glossed-term${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      title={meaning}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        // Tap mobile : révéler la traduction sans bloquer les liens parents.
        if ((e.target as HTMLElement).closest("a, button")) return;
        setOpen((v) => !v);
      }}
    >
      <span
        className="glossed-term__word"
        tabIndex={focusable ? 0 : undefined}
        aria-describedby={hintId}
      >
        {children ?? term}
      </span>
      <span id={hintId} className="glossed-term__hint" role="tooltip" aria-hidden={!open}>
        {meaning}
      </span>
    </span>
  );
}
