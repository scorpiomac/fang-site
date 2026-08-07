import { forwardRef } from "react";
import { copy } from "@/content/copy";
import { storyEntities } from "@/content/storyEntities";
import { useCmsText } from "@/context/CmsContext";

function EntityGlyph({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 48 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "fod":
      return (
        <svg {...common}>
          <path d="M6 18c2-8 6-12 10-12" />
          <path d="M20 6c2 4 2 10 0 14" />
          <path d="M28 18c4-10 10-12 14-8" />
        </svg>
      );
    case "ohasso":
      return (
        <svg {...common}>
          <path d="M4 16c3-8 7-10 10-6" />
          <path d="M16 8c2 6 4 10 2 12" />
          <path d="M22 18c3-9 7-11 10-7" />
          <path d="M34 9c1 5 3 9 1 11" />
          <path d="M38 17c3-6 6-8 8-5" />
        </svg>
      );
    case "teunk":
      return (
        <svg {...common}>
          <path d="M5 17c2-7 5-10 8-8" />
          <path d="M15 8v12" />
          <path d="M21 18c3-9 6-11 9-7" />
          <path d="M32 9c2 5 3 9 1 11" />
          <path d="M38 17c3-7 6-9 8-6" />
        </svg>
      );
    default:
      return null;
  }
}

export const StorySection = forwardRef<HTMLElement>(function StorySection(_, ref) {
  const tagline = useCmsText("brand.tagline", copy.tagline);
  const taglineFr = useCmsText("brand.taglineFr", copy.taglineFr);

  return (
    <section
      ref={ref}
      className="story story--entities"
      id="philosophie"
      aria-labelledby="philosophie-title"
    >
      <div className="story__inner">
        <header className="story__head">
          <p className="story__eyebrow" id="philosophie-title">
            Philosophie
          </p>
          <h2 className="story__title">Les entités qui portent le récit</h2>
          <p className="story__lede">
            {tagline} — {taglineFr}.
          </p>
        </header>

        <ul className="story__entities" aria-label="Entités du récit FANG">
          {storyEntities.map((entity) => (
            <li
              key={entity.id}
              className={`story-entity${entity.tone === "antagonist" ? " story-entity--antagonist" : ""}`}
            >
              <span className="story-entity__glyph">
                <EntityGlyph id={entity.id} />
              </span>
              <h3 className="story-entity__name">{entity.name}</h3>
              <p className="story-entity__role">{entity.role}</p>
              <p className="story-entity__body">{entity.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});
