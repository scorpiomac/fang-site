type Props = {
  items: string[];
  className?: string;
};

export function MarqueeStrip({ items, className = "" }: Props) {
  const text = items.join("  ·  ") + "  ·  ";
  return (
    <div className={`marquee-strip ${className}`} aria-hidden="true">
      <div className="marquee-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
