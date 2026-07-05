import { copy } from "@/content/copy";

type TrustIcon = "scissors" | "hourglass" | "mannequin" | "whatsapp";

const TRUST_ICONS: TrustIcon[] = ["scissors", "hourglass", "mannequin", "whatsapp"];

function TrustIconMark({ name }: { name: TrustIcon }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="14" cy="12" r="4" />
          <circle cx="14" cy="36" r="4" />
          <path d="M18 14l20 18M18 34l20-18" />
        </svg>
      );
    case "hourglass":
      return (
        <svg {...common}>
          <path d="M14 8h20v6c0 4-8 6-10 10-2-4-10-6-10-10V8Z" />
          <path d="M14 40h20v-6c0-4-8-6-10-10-2 4-10 6-10 10v6Z" />
        </svg>
      );
    case "mannequin":
      return (
        <svg {...common}>
          <ellipse cx="24" cy="10" rx="5" ry="3" />
          <path d="M24 13v6" />
          <path d="M16 22c0-4 4-6 8-6s8 2 8 6v18H16V22Z" />
          <path d="M16 28h16" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M24 8c-8.8 0-16 6.4-16 14.3 0 4.5 2.2 8.5 5.7 11.1L12 40l6.8-2.2c2 .9 4.2 1.4 6.5 1.4 8.8 0 16-6.4 16-14.3S32.8 8 24 8Z" />
          <path d="M18 20c1.2 3.2 4.6 6.6 7.8 7.8l1.6-1.6c.3-.3.8-.4 1.2-.2 1 .4 2.1.7 3.2.7.6 0 1.1.5 1.1 1.1v2.4c0 .6-.5 1.1-1.1 1.1-6.2 0-11.2-5-11.2-11.2 0-.6.5-1.1 1.1-1.1H22c.6 0 1.1.5 1.1 1.1 0 1.1.3 2.2.7 3.2.2.4.1.9-.2 1.2L22 20Z" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  compact?: boolean;
  withIcons?: boolean;
};

export function TrustStrip({ compact = false, withIcons = false }: Props) {
  return (
    <ul
      className={`trust-strip${compact ? " trust-strip--compact" : ""}${withIcons ? " trust-strip--icons" : ""}`}
      aria-label="Engagements FANG"
    >
      {copy.trustItems.map((item, index) => (
        <li key={item.title}>
          {withIcons ? (
            <span className="trust-strip__icon" aria-hidden="true">
              <TrustIconMark name={TRUST_ICONS[index] ?? "scissors"} />
            </span>
          ) : null}
          <div className="trust-strip__copy">
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
