import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { GlossedTerm } from "@/components/ui/GlossedTerm";
import { copy } from "@/content/copy";
import { useCmsText } from "@/context/CmsContext";

const MANIFEST_FR = "Expose-toi. Tu es beau. Tu es toi. C'est suffisant.";
const MANIFEST_EN =
  "Expose yourself. You are beautiful. You are you. It's enough.";

export const ManifestSection = forwardRef<HTMLElement>(function ManifestSection(_, ref) {
  const eyebrow = useCmsText("home.manifest.eyebrow", copy.manifestEyebrow);
  const line = useCmsText("home.manifest.line", copy.manifestLine);
  const body = useCmsText("home.manifest.body", copy.manifestBody);
  const isDefaultManifest =
    line.replace(/['']/g, "'").replace(/\s+/g, " ").trim() ===
    MANIFEST_FR.replace(/['']/g, "'").replace(/\s+/g, " ").trim();

  return (
    <section ref={ref} className="manifest" id="manifeste" aria-labelledby="manifeste-title">
      <p className="manifest__eyebrow">{eyebrow}</p>
      <h2 className="manifest__title" id="manifeste-title">
        <GlossedTerm
          term={line}
          meaning={isDefaultManifest ? MANIFEST_EN : line}
          focusable
          className="manifest__gloss"
        >
          {line}
        </GlossedTerm>
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
