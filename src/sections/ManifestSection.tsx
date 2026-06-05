import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { copy } from "@/content/copy";

export const ManifestSection = forwardRef<HTMLElement>(function ManifestSection(_, ref) {
  return (
    <section ref={ref} className="manifest" id="manifeste" aria-labelledby="manifeste-title">
      <p className="manifest__eyebrow">{copy.manifestEyebrow}</p>
      <h2 className="manifest__title" id="manifeste-title">
        {copy.manifestLine}
      </h2>
      <p className="manifest__body">{copy.manifestBody}</p>
      <p className="manifest__signature">— Fallou Ngom, créateur de FANG</p>
      <div className="manifest__actions">
        <Link to="/boutique" className="cta cta--solid manifest__cta">
          <span>Commander la collection</span>
          <span aria-hidden="true">→</span>
        </Link>
        <a href="#personnages" className="cta cta--ghost manifest__cta">
          Revoir les personnages
        </a>
      </div>
    </section>
  );
});
