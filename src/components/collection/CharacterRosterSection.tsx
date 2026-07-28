import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getArchetypeRoster } from "@/content/characterArchetypeRoster";
import { publicUrl } from "@/lib/publicUrl";
import { GlossedTerm } from "@/components/ui/GlossedTerm";
import { CharacterTurntable } from "@/components/collection/CharacterTurntable";
const roster = getArchetypeRoster();

function slotOffset(index: number, selected: number, count: number): number {
  let offset = index - selected;
  const half = Math.floor(count / 2);
  if (offset > half) offset -= count;
  if (offset < -half) offset += count;
  return offset;
}

/** Position en arc sur la plateforme — rayon adapté à la largeur viewport */
function slotArc(offset: number, radiusX: number) {
  const abs = Math.abs(offset);
  const isCenter = offset === 0;
  const angleRad = (offset * 24 * Math.PI) / 180;
  const lift = (Math.cos(angleRad) - 1) * 22;

  return {
    x: `${Math.sin(angleRad) * radiusX}px`,
    y: `${lift + (isCenter ? -6 : abs * 5)}px`,
    scale: isCenter ? 1 : Math.max(0.58, 0.68 - abs * 0.05),
    opacity: isCenter ? 1 : Math.max(0.55, 0.82 - abs * 0.1),
  };
}

function arcRadiusForViewport(width: number): number {
  if (width <= 640) return 0;
  if (width <= 900) return Math.min(220, Math.max(140, width * 0.28));
  if (width <= 1200) return Math.min(280, width * 0.26);
  return 320;
}

export function CharacterRosterSection() {
  const titleId = useId();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const [arcRadius, setArcRadius] = useState(() =>
    typeof window !== "undefined" ? arcRadiusForViewport(window.innerWidth) : 320
  );
  const dragRef = useRef({ startX: 0, active: false });
  const count = roster.length;

  useEffect(() => {
    const onResize = () => setArcRadius(arcRadiusForViewport(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const select = useCallback(
    (index: number) => {
      if (count === 0) return;
      setSelected(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        select(selected + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        select(selected - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select, selected]);

  useEffect(() => {
    if (reduced || autoPaused || count < 2) return;
    const id = window.setInterval(() => {
      setSelected((current) => (current + 1) % count);
    }, 3000);
    return () => window.clearInterval(id);
  }, [autoPaused, count, reduced]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".archetype-screen__pivot")) return;
    setAutoPaused(true);
    dragRef.current = { startX: e.clientX, active: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 40) select(selected + (delta > 0 ? -1 : 1));
    dragRef.current.active = false;
  };

  const stepPrev = (e: MouseEvent | PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAutoPaused(true);
    select(selected - 1);
  };

  const stepNext = (e: MouseEvent | PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAutoPaused(true);
    select(selected + 1);
  };

  if (count === 0) return null;

  const active = roster[selected]!;

  return (
    <section className="archetype-screen" id="personnages" aria-labelledby={titleId}>
      <div className="archetype-screen__layout">
        <div className="archetype-screen__left">
          <header className="archetype-screen__intro">
            <p className="archetype-screen__eyebrow">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="archetype-screen__eyebrow-icon">
                <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span>/ Archétype</span>
            </p>
            <h1 id={titleId} className="archetype-screen__title">
              Chaque humain est un archétype
            </h1>
            <p className="archetype-screen__lede">
              Chacun incarne une manière d'exister que la société a cherché à réduire, et que la
              marque revalorise.
            </p>
          </header>

          <div
            className="archetype-screen__stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={() => setAutoPaused(true)}
            onMouseLeave={() => setAutoPaused(false)}
            onFocus={() => setAutoPaused(true)}
            onBlur={() => setAutoPaused(false)}
          >
            <div className="archetype-screen__dais" aria-hidden="true">
              <div className="archetype-screen__dais-outer" />
              <div className="archetype-screen__dais-mid">
                <span className="archetype-screen__dais-strip" />
              </div>
              <div className="archetype-screen__dais-inner">
                <span className="archetype-screen__dais-strip archetype-screen__dais-strip--inner" />
              </div>
            </div>

            <div className="archetype-screen__pivot-bar">
              <div className="archetype-screen__pivot">
                <button
                  type="button"
                  className="archetype-screen__pivot-btn"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={stepPrev}
                  aria-label="Archétype précédent"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
                <span className="archetype-screen__pivot-mouse" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="8" y="3" width="8" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M12 7v3" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
                <span className="archetype-screen__pivot-label">Faites glisser pour pivoter</span>
                <button
                  type="button"
                  className="archetype-screen__pivot-btn"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={stepNext}
                  aria-label="Archétype suivant"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="archetype-screen__cast" aria-live="polite">
              {roster.map((entry, index) => {
                const offset = slotOffset(index, selected, count);
                const isCenter = offset === 0;
                const abs = Math.abs(offset);
                if (abs > 2) return null;

                const arc = slotArc(offset, arcRadius);
                const style = {
                  "--slot-x": arc.x,
                  "--slot-y": arc.y,
                  "--slot-scale": arc.scale,
                  "--slot-opacity": arc.opacity,
                  zIndex: isCenter ? 8 : 11 - abs,
                } as CSSProperties;

                return (
                  <button
                    key={entry.clipId}
                    type="button"
                    className={`archetype-screen__figure${isCenter ? " is-center" : ""}`}
                    style={style}
                    onClick={() => select(index)}
                    aria-pressed={isCenter}
                    aria-label={entry.name}
                  >
                    <div className="archetype-screen__figure-body">
                      <div className="archetype-screen__figure-model-wrap">
                        <div
                          className={`archetype-screen__figure-model-stage${isCenter ? " is-center" : ""}`}
                        >
                          {isCenter ? (
                            <CharacterTurntable
                              key={entry.clipId}
                              framePath={entry.framePath}
                              frameCount={entry.frameCount}
                              name={entry.name}
                              className="archetype-screen__figure-model"
                            />
                          ) : (
                            <img
                              src={publicUrl(entry.coverPath)}
                              alt=""
                              className="archetype-screen__figure-model"
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="archetype-screen__figure-pedestal">
                      <span className="archetype-screen__figure-ring" />
                      <span className="archetype-screen__figure-plate">
                        <GlossedTerm term={entry.name} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          <div className="archetype-screen__thumbs" role="tablist" aria-label="Archétypes">
            {roster.map((entry, index) => (
              <button
                key={entry.clipId}
                type="button"
                role="tab"
                aria-selected={index === selected}
                className={`archetype-screen__thumb${index === selected ? " is-active" : ""}`}
                onClick={() => select(index)}
              >
                <img
                  src={publicUrl(entry.coverPath)}
                  alt={entry.name}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>

        <aside className="archetype-screen__panel">
          <p className="archetype-screen__panel-eyebrow">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>/ Archétype</span>
          </p>

          <h2 className="archetype-screen__panel-name">
            <GlossedTerm term={active.name} focusable />
          </h2>
          <p className="archetype-screen__panel-bio">{active.description}</p>

          {active.energyLine || active.style || active.visualContent ? (
            <ul className="archetype-screen__attrs">
              {active.energyLine ? (
                <li>
                  <span className="archetype-screen__attr-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
                      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8z" />
                    </svg>
                  </span>
                  <div className="archetype-screen__attr-copy">
                    <span className="archetype-screen__attr-label">Énergie</span>
                    <span className="archetype-screen__attr-value">{active.energyLine}</span>
                  </div>
                </li>
              ) : null}
              {active.style ? (
                <li>
                  <span className="archetype-screen__attr-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
                      <path d="M4 20 12 4l8 16" />
                      <path d="M7.5 14h9" />
                      <circle cx="12" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <div className="archetype-screen__attr-copy">
                    <span className="archetype-screen__attr-label">Style</span>
                    <span className="archetype-screen__attr-value">{active.style}</span>
                  </div>
                </li>
              ) : null}
              {active.visualContent ? (
                <li>
                  <span className="archetype-screen__attr-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
                      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
                      <circle cx="9" cy="10.5" r="1.6" />
                      <path d="m7.5 16.5 3.2-3.2 2.4 2.4 3.4-4.2 3 5" />
                    </svg>
                  </span>
                  <div className="archetype-screen__attr-copy">
                    <span className="archetype-screen__attr-label">Contenu visuel</span>
                    <span className="archetype-screen__attr-value">{active.visualContent}</span>
                  </div>
                </li>
              ) : null}
            </ul>
          ) : null}

          <Link
            className="archetype-screen__cta"
            to={`/collection/${active.chapterSlug}/${active.characterSlug}`}
          >
            <span>Découvrir son univers</span>
            <span className="archetype-screen__cta-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </aside>
      </div>
    </section>
  );
}
