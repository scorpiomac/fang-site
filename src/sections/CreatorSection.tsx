import { forwardRef } from "react";
import { creator } from "@/content/creator";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";
import { useCmsText } from "@/context/CmsContext";

export const CreatorSection = forwardRef<HTMLElement>(function CreatorSection(_, ref) {
  const eyebrow = useCmsText("home.creator.eyebrow", copy.creatorEyebrow);
  const name = useCmsText("home.creator.name", creator.name);
  const role = useCmsText("home.creator.role", creator.role);
  const quote = useCmsText("home.creator.quote", copy.creatorQuote);
  return (
    <section
      ref={ref}
      className="creator"
      id="createur"
      aria-labelledby="createur-title"
    >
      <div className="creator__grid">
        <aside className="creator__portrait" aria-hidden="true">
          <div className="creator__portrait-frame">
            <img src={publicUrl("chapters/ch6/img1.jpg")} alt="" loading="lazy" />
          </div>
          <p className="creator__portrait-caption">
            Atelier — Dakar, Sénégal
          </p>
        </aside>

        <div className="creator__body">
          <p className="creator__eyebrow">{eyebrow}</p>
          <h2 className="creator__name" id="createur-title">
            {name}
          </h2>
          <p className="creator__role">{role}</p>

          <blockquote className="creator__quote">{quote}</blockquote>

          <div className="creator__paragraphs">
            {creator.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="creator__pillars">
            {creator.pillars.map((p) => (
              <article key={p.title} className="pillar">
                <h3 className="pillar__title">{p.title}</h3>
                <p className="pillar__body">{p.body}</p>
              </article>
            ))}
          </div>

          <div className="creator__inspirations">
            <p className="creator__inspirations-label">Inspirations</p>
            <ul>
              {creator.inspirations.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
});
