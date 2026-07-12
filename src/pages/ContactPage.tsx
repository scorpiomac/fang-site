import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { submitContactMessage } from "@/lib/storeApi";
import { useSiteSettings } from "@/context/siteSettingsContext";

export function ContactPage() {
  const { settings } = useSiteSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState<string>("");

  const whatsappDigits = (settings.contact.whatsapp || "").replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : undefined;
  const phoneHref = settings.contact.phone
    ? `tel:${settings.contact.phone.replace(/\s/g, "")}`
    : undefined;

  const instagramUrl = settings.social.instagram;
  const instagramHandle = instagramUrl
    ? `@${instagramUrl.replace(/\/$/, "").split("/").pop()}`
    : "@fanglamarque";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      setFeedback("Tous les champs marqués * sont obligatoires.");
      return;
    }
    setStatus("sending");
    const res = await submitContactMessage({ name, email, phone, message });
    if (res.ok) {
      setStatus("ok");
      setFeedback(res.message ?? "Message envoyé. Merci !");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } else {
      setStatus("error");
      setFeedback(res.error ?? "Une erreur est survenue.");
    }
  };

  return (
    <>
      <main id="contenu-principal" className="static-page">
        <div className="static-page__container">
          <h1 className="static-page__title">Nous contacter</h1>
          <p className="static-page__intro">
            Une question, une commande spéciale, une opportunité ? Écrivez-nous, nous répondons
            sous 24-48h.
          </p>

          <div className="contact-grid">
            <div className="contact-info">
              <div>
                <p className="contact-info__label">Fondateur</p>
                <p className="contact-info__value">Fallou Ngom</p>
              </div>
              <div>
                <p className="contact-info__label">Marque / WhatsApp</p>
                {whatsappHref ? (
                  <a
                    className="link-underline"
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {settings.contact.phone || `+${whatsappDigits}`}
                  </a>
                ) : phoneHref ? (
                  <a className="link-underline" href={phoneHref}>
                    {settings.contact.phone}
                  </a>
                ) : (
                  <p className="contact-info__value">—</p>
                )}
              </div>
              <div>
                <p className="contact-info__label">E-mail</p>
                <a className="link-underline" href={`mailto:${settings.contact.email}`}>
                  {settings.contact.email}
                </a>
              </div>
              <div>
                <p className="contact-info__label">Instagram</p>
                {instagramUrl ? (
                  <a
                    className="link-underline"
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {instagramHandle}
                  </a>
                ) : (
                  <p className="contact-info__value">{instagramHandle}</p>
                )}
              </div>
              {settings.brand.address ? (
                <div>
                  <p className="contact-info__label">Adresse</p>
                  <p className="contact-info__value">{settings.brand.address}</p>
                </div>
              ) : null}
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>Nom *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label className="form-field">
                <span>E-mail *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="form-field">
                <span>Téléphone (facultatif)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="form-field">
                <span>Message *</span>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </label>
              {feedback ? (
                <p
                  className={
                    status === "ok" ? "form-feedback form-feedback--ok" : "form-feedback form-feedback--error"
                  }
                >
                  {feedback}
                </p>
              ) : null}
              <button type="submit" className="cta-primary" disabled={status === "sending"}>
                {status === "sending" ? "Envoi…" : "Envoyer le message"}
              </button>
              <p className="static-page__updated">
                Vos données ne sont utilisées que pour vous répondre — voir{" "}
                <Link to="/pages/confidentialite" className="link-underline">
                  notre politique de confidentialité
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
