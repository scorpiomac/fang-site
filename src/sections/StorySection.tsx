import {
  forwardRef,
  useCallback,
  useRef,
  type MouseEvent,
  type MutableRefObject,
} from "react";
import {
  copy,
  storyFooterQuote,
  storyIntro,
  storyPillars,
  type StoryPillarIcon,
} from "@/content/copy";
import { useCmsText, useCmsList } from "@/context/CmsContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useStorySectionMotion } from "@/hooks/useStorySectionMotion";

function StoryIcon({ name }: { name: StoryPillarIcon }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "eye":
      return (
        <svg {...common}>
          <path d="M6 24s8-14 18-14 18 14 18 14-8 14-18 14S6 24 6 24Z" />
          <circle cx="24" cy="24" r="5" />
        </svg>
      );
    case "branch":
      return (
        <svg {...common}>
          <path d="M10 34c8-2 12-10 14-18" />
          <path d="M18 28c4-6 10-10 18-12" />
          <path d="M22 18c2-4 6-7 12-8" />
          <path d="M14 30l4-4M26 20l4-4" />
        </svg>
      );
    case "mask":
      return (
        <svg {...common}>
          <path d="M10 18c2-6 8-10 14-10s12 4 14 10v8c-2 8-8 14-14 14s-12-6-14-14v-8Z" />
          <path d="M18 22h4M26 22h4" />
          <path d="M20 30c2 2 6 2 8 0" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="7" />
          <path d="M24 8v4M24 36v4M8 24h4M36 24h4M13 13l3 3M32 32l3 3M35 13l-3 3M16 32l-3 3" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M24 36s-12-7-12-16a7 7 0 0 1 12-4 7 7 0 0 1 12 4c0 9-12 16-12 16Z" />
        </svg>
      );
    default:
      return null;
  }
}

function onCardPointerMove(e: MouseEvent<HTMLLIElement>) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty("--mx", `${x}%`);
  card.style.setProperty("--my", `${y}%`);
}

function onCardPointerLeave(e: MouseEvent<HTMLLIElement>) {
  e.currentTarget.style.removeProperty("--mx");
  e.currentTarget.style.removeProperty("--my");
}

export const StorySection = forwardRef<HTMLElement>(function StorySection(_, ref) {
  const localRef = useRef(null) as MutableRefObject<HTMLElement | null>;
  const reduced = useReducedMotion();
  const tagline = useCmsText("brand.tagline", copy.tagline);
  const taglineFr = useCmsText("brand.taglineFr", copy.taglineFr);
  const intro = useCmsText("home.story.intro", storyIntro);
  const footerQuote = useCmsText("home.story.footerQuote", storyFooterQuote);
  const cmsTitles = useCmsList(
    "home.story.fragments",
    storyPillars.map((p) => p.title)
  );

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref]
  );

  useStorySectionMotion(localRef, !reduced);

  const pillars = storyPillars.map((pillar, i) => ({
    ...pillar,
    title: cmsTitles[i] ?? pillar.title,
  }));

  return (
    <section
      ref={setRefs}
      className={`story${reduced ? " story--reduced" : ""}`}
      id="philosophie"
      aria-labelledby="philosophie-title"
    >
      <div className="story__watermark" aria-hidden="true">
        FANG
      </div>

      <div className="story__inner">
        <header className="story__masthead">
          <div className="story__eyebrow-row">
            <span className="story__eyebrow-line" aria-hidden="true" />
            <p className="story__eyebrow" id="philosophie-title">
              Philosophie
            </p>
            <span className="story__eyebrow-line" aria-hidden="true" />
          </div>
        </header>

        <div className="story__intro-grid">
          <h2 className="story__title">
            <span className="story__title-accent">{tagline}</span>
            <span className="story__title-sep"> — </span>
            <span className="story__title-main">{taglineFr}.</span>
          </h2>
          <p className="story__intro">{intro}</p>
        </div>

        <ol className="story__cards">
          {pillars.map((pillar, i) => (
            <li
              key={pillar.title}
              className="story-card"
              onMouseMove={onCardPointerMove}
              onMouseLeave={onCardPointerLeave}
            >
              <span className="story-card__num">{String(i + 1).padStart(2, "0")}</span>
              <div className="story-card__icon" aria-hidden="true">
                <span className="story-card__icon-ring" aria-hidden="true" />
                <StoryIcon name={pillar.icon} />
              </div>
              <h3 className="story-card__title">{pillar.title}</h3>
              <p className="story-card__desc">{pillar.description}</p>
            </li>
          ))}
        </ol>

        <blockquote className="story__closing">
          <span className="story__closing-mark" aria-hidden="true">
            &ldquo;
          </span>
          <p>{footerQuote}</p>
          <span className="story__closing-mark story__closing-mark--end" aria-hidden="true">
            &rdquo;
          </span>
        </blockquote>
      </div>
    </section>
  );
});
