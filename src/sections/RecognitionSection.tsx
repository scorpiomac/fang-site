import { Link } from "react-router-dom";
import { recognition } from "@/content/creator";
import { copy } from "@/content/copy";

export function RecognitionSection() {
  return (
    <section
      className="recognition"
      id="reconnaissance"
      aria-labelledby="reconnaissance-title"
    >
      <div className="recognition__head">
        <p className="recognition__eyebrow">{copy.recognitionEyebrow}</p>
        <h2 className="recognition__title" id="reconnaissance-title">
          {copy.recognitionTitle}
        </h2>
        <p className="recognition__lede">{copy.recognitionBody}</p>
      </div>

      <ol className="recognition__timeline">
        {recognition.items.map((it) => (
          <li key={it.title} className="recognition-item">
            <span className="recognition-item__year">{it.year}</span>
            <div className="recognition-item__core">
              <h3 className="recognition-item__title">{it.title}</h3>
              <p className="recognition-item__body">{it.body}</p>
            </div>
            <span className="recognition-item__rule" aria-hidden="true" />
          </li>
        ))}
      </ol>

      <div className="recognition__vision">
        <p className="recognition__vision-label">Vision — 2030</p>
        <p className="recognition__vision-text">{recognition.vision}</p>
        <ul className="recognition__cities">
          <li>Dakar</li>
          <li>Paris</li>
          <li>Londres</li>
          <li>New&nbsp;York</li>
          <li>Tokyo</li>
        </ul>
        <Link to="/boutique" className="cta cta--solid recognition__cta">
          <span>Commander une pièce</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
