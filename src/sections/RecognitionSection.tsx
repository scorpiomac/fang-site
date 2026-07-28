import { forwardRef, useCallback, useRef, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { recognition, type RecognitionIcon } from "@/content/creator";
import { copy } from "@/content/copy";
import { useCmsText } from "@/context/CmsContext";
import { publicUrl } from "@/lib/publicUrl";
import { MediaImage } from "@/components/ui/MediaImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRecognitionSectionMotion } from "@/hooks/useRecognitionSectionMotion";

function RecognitionIconMark({ name }: { name: RecognitionIcon }) {
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
    case "laurel":
      return (
        <svg {...common}>
          <path d="M24 8c-6 4-10 10-10 16 0 6 4 10 10 10s10-4 10-10c0-6-4-12-10-16Z" />
          <path d="M24 14v18" />
          <path d="M18 20c-2 2-3 5-3 8M30 20c2 2 3 5 3 8" />
          <path d="M20 28h8" />
          <path d="M22 32l2 3 2-3" />
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
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="14" cy="12" r="4" />
          <circle cx="14" cy="36" r="4" />
          <path d="M18 14l20 18M18 34l20-18" />
        </svg>
      );
    default:
      return null;
  }
}

export const RecognitionSection = forwardRef<HTMLElement>(function RecognitionSection(_, ref) {
  const localRef = useRef(null) as MutableRefObject<HTMLElement | null>;
  const reduced = useReducedMotion();
  const eyebrow = useCmsText("home.recognition.eyebrow", copy.recognitionEyebrow);
  const title = useCmsText("home.recognition.title", copy.recognitionTitle);

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref]
  );

  useRecognitionSectionMotion(localRef, !reduced);

  return (
    <section
      ref={setRefs}
      className={`recognition${reduced ? " recognition--reduced" : ""}`}
      id="reconnaissance"
      aria-labelledby="reconnaissance-title"
    >
      <div className="recognition__head">
        <p className="recognition__eyebrow">
          <span className="recognition__eyebrow-line" aria-hidden="true" />
          <span className="recognition__eyebrow-text">{eyebrow}</span>
          <span className="recognition__eyebrow-line" aria-hidden="true" />
        </p>
        <h2 className="recognition__title" id="reconnaissance-title">
          {title.includes("2026") ? (
            <>
              {title.replace(/\s*2026\s*$/, "").trim()}{" "}
              <span className="recognition__title-accent">2026</span>
            </>
          ) : (
            title
          )}
        </h2>
      </div>

      <ol className="recognition__timeline">
        <span className="recognition__timeline-rail" aria-hidden="true" />
        {recognition.items.map((it) => (
          <li key={it.title} className="recognition-milestone">
            <span className="recognition-milestone__node" aria-hidden="true" />
            <span className="recognition-milestone__year">{it.year}</span>
            <article className="recognition-milestone__card">
              <div className="recognition-milestone__icon" aria-hidden="true">
                <RecognitionIconMark name={it.icon} />
              </div>
              <div className="recognition-milestone__copy">
                <h3 className="recognition-milestone__title">{it.title}</h3>
                <p className="recognition-milestone__body">{it.body}</p>
              </div>
              <figure
                className={`recognition-milestone__media${
                  it.imageFit === "contain" ? " recognition-milestone__media--contain" : ""
                }${it.imageAspect === "square" ? " recognition-milestone__media--square" : ""}`}
              >
                <MediaImage
                  src={publicUrl(it.image)}
                  fallbacks={[publicUrl("recognition/reconnaissance-design.png")]}
                  alt={
                    it.year === "2026"
                      ? "Trophée JOJ Dakar"
                      : it.year === "2025"
                        ? "Défilé officiel FANG"
                        : "Atelier de couture à Dakar"
                  }
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </article>
          </li>
        ))}
      </ol>

      <div className="recognition__vision">
        <span className="recognition__vision-globe" aria-hidden="true">
          <span className="recognition__vision-globe-aura" />
          <svg viewBox="0 0 120 120" fill="none" className="recognition__vision-globe-svg">
            <circle
              className="recognition__globe-outline"
              cx="60"
              cy="60"
              r="48"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <g className="recognition__globe-meridians">
              <ellipse cx="60" cy="60" rx="20" ry="48" stroke="currentColor" strokeWidth="0.6" />
              <ellipse
                cx="60"
                cy="60"
                rx="20"
                ry="48"
                stroke="currentColor"
                strokeWidth="0.6"
                transform="rotate(60 60 60)"
              />
              <ellipse
                cx="60"
                cy="60"
                rx="20"
                ry="48"
                stroke="currentColor"
                strokeWidth="0.6"
                transform="rotate(120 60 60)"
              />
            </g>
            <g className="recognition__globe-parallels">
              <path d="M12 60h96" stroke="currentColor" strokeWidth="0.6" />
              <path d="M60 12v96" stroke="currentColor" strokeWidth="0.6" />
              <path d="M18 36c16 8 68 8 84 0" stroke="currentColor" strokeWidth="0.6" />
              <path d="M18 84c16-8 68-8 84 0" stroke="currentColor" strokeWidth="0.6" />
              <ellipse cx="60" cy="60" rx="48" ry="14" stroke="currentColor" strokeWidth="0.5" />
            </g>
          </svg>
        </span>
        <p className="recognition__vision-label">Vision — 2030</p>
        <blockquote className="recognition__vision-quote">
          <span className="recognition__vision-mark recognition__vision-mark--open" aria-hidden="true">
            &ldquo;
          </span>
          {recognition.vision}
          <span className="recognition__vision-mark recognition__vision-mark--close" aria-hidden="true">
            &rdquo;
          </span>
        </blockquote>
        <ul className="recognition__cities">
          {recognition.cities.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
        <Link to="/boutique" className="recognition__cta">
          <span>Commander une pièce</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
});
