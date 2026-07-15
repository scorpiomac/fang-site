import { GlossedTerm } from "@/components/ui/GlossedTerm";

type Props = {
  items: string[];
  className?: string;
  /** Wrap each item with GlossedTerm (noms d’archétypes). */
  gloss?: boolean;
};

function MarqueeGroup({
  items,
  gloss,
  inert,
}: {
  items: string[];
  gloss: boolean;
  inert?: boolean;
}) {
  return (
    <div className="marquee-track__group" aria-hidden={inert || undefined}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="marquee-track__item">
          {gloss ? <GlossedTerm term={item} /> : <span className="marquee-track__text">{item}</span>}
          <span className="marquee-track__sep" aria-hidden="true">
            {" · "}
          </span>
        </span>
      ))}
    </div>
  );
}

export function MarqueeStrip({ items, className = "", gloss = false }: Props) {
  return (
    <div
      className={`marquee-strip${gloss ? " marquee-strip--gloss" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden={gloss ? undefined : true}
    >
      <div className="marquee-track">
        <MarqueeGroup items={items} gloss={gloss} />
        <MarqueeGroup items={items} gloss={gloss} inert />
      </div>
    </div>
  );
}
