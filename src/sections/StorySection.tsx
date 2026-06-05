import { forwardRef } from "react";
import { storyFragments, copy } from "@/content/copy";

export const StorySection = forwardRef<HTMLElement>(function StorySection(_, ref) {
  return (
    <section ref={ref} className="story" id="philosophie" aria-labelledby="philosophie-title">
      <div className="story__rail">
        <p className="story__eyebrow" id="philosophie-title">
          Philosophie
        </p>
        <p className="story__lede">{copy.tagline} — {copy.taglineFr}.</p>
        <ol className="story__lines">
          {storyFragments.map((line, i) => (
            <li key={line} className="story-fragment" data-index={String(i + 1).padStart(2, "0")}>
              <span className="story-fragment__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="story-fragment__text">{line}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="story__edge" aria-hidden="true">
        <span>FANG</span>
        <span>·</span>
        <span>EXPOSITION</span>
        <span>·</span>
        <span>WOLOF</span>
        <span>·</span>
        <span>DAKAR</span>
        <span>·</span>
        <span>2024 →</span>
      </div>
    </section>
  );
});
