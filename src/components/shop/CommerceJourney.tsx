import { Link } from "react-router-dom";

export type JourneyStep = {
  label: string;
  to?: string;
  current?: boolean;
};

type Props = {
  steps: JourneyStep[];
};

export function CommerceJourney({ steps }: Props) {
  return (
    <nav className="commerce-journey" aria-label="Parcours d'achat">
      <ol>
        {steps.map((step, i) => (
          <li
            key={`${step.label}-${i}`}
            className={step.current ? "commerce-journey__step--current" : undefined}
          >
            {step.to && !step.current ? (
              <Link to={step.to}>{step.label}</Link>
            ) : (
              <span aria-current={step.current ? "step" : undefined}>{step.label}</span>
            )}
            {i < steps.length - 1 ? <span className="commerce-journey__sep" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
