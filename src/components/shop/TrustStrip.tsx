import { copy } from "@/content/copy";

type Props = {
  compact?: boolean;
};

export function TrustStrip({ compact = false }: Props) {
  return (
    <ul className={`trust-strip${compact ? " trust-strip--compact" : ""}`} aria-label="Engagements FANG">
      {copy.trustItems.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}
