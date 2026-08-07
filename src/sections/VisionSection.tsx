import { Link } from "react-router-dom";
import { recognition } from "@/content/creator";

/** Bloc Vision — 2030 (même contenu que https://fang.tickets-place.net/) */
export function VisionSection() {
  return (
    <section className="vision-2030" id="vision-2030" aria-labelledby="vision-2030-title">
      <div className="vision-2030__panel recognition__vision">
        <span className="recognition__vision-globe is-animated" aria-hidden="true">
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
        <p className="recognition__vision-label" id="vision-2030-title">
          Vision — 2030
        </p>
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
}
