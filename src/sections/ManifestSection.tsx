import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { copy } from "@/content/copy";
import { useCmsText } from "@/context/CmsContext";

export const ManifestSection = forwardRef<HTMLElement>(function ManifestSection(_, ref) {
  const eyebrow = useCmsText("home.manifest.eyebrow", copy.manifestEyebrow);
  const line = useCmsText("home.manifest.line", copy.manifestLine);
  const body = useCmsText("home.manifest.body", copy.manifestBody);
  return (
    <section ref={ref} className="manifest" id="manifeste" aria-labelledby="manifeste-title">
      <p className="manifest__eyebrow">{eyebrow}</p>
      <h2 className="manifest__title" id="manifeste-title">
        {line}
      </h2>
      <p className="manifest__body">{body}</p>
      <p className="manifest__signature">— Fallou Ngom, créateur de FANG</p>
      <div className="manifest__actions">
        <Link to="/boutique" className="cta cta--solid manifest__cta">
          <span>Commander la collection</span>
          <span aria-hidden="true">→</span>
        </Link>
        <a href="#collections" className="cta cta--ghost manifest__cta">
          Revoir les chapitres
        </a>
      </div>
    </section>
  );
});
