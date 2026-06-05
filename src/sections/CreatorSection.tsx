import { forwardRef } from "react";
import { creator } from "@/content/creator";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";

export const CreatorSection = forwardRef<HTMLElement>(function CreatorSection(_, ref) {
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
          <p className="creator__eyebrow">{copy.creatorEyebrow}</p>
          <h2 className="creator__name" id="createur-title">
            {creator.name}
          </h2>
          <p className="creator__role">{creator.role}</p>

          <blockquote className="creator__quote">{copy.creatorQuote}</blockquote>

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
