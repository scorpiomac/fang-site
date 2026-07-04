import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { copy } from "@/content/copy";

type Props = {
  show: boolean;
  reducedMotion: boolean;
  line: string;
  subline: string;
  onEnter: (withAmbient: boolean) => void;
};

export function PersonnageCinematicIntro({ show, reducedMotion, line, subline, onEnter }: Props) {
  const [phase, setPhase] = useState<"void" | "text" | "actions">("void");

  useEffect(() => {
    if (!show) return;
    if (reducedMotion) {
      setPhase("actions");
      return;
    }
    setPhase("void");
    const t1 = window.setTimeout(() => setPhase("text"), 700);
    const t2 = window.setTimeout(() => setPhase("actions"), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <div className="personnage-imm__intro" role="dialog" aria-modal="true" aria-label="Introduction">
      <div className="personnage-imm__intro-veil" />
      <AnimatePresence mode="wait">
        {phase === "void" && !reducedMotion ? (
          <motion.div
            key="void"
            className="personnage-imm__intro-void"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          />
        ) : null}
      </AnimatePresence>

      <div className="personnage-imm__intro-body">
        <AnimatePresence>
          {(phase === "text" || phase === "actions" || reducedMotion) && (
            <motion.div
              key="copy"
              className="personnage-imm__intro-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="personnage-imm__intro-line">{line}</p>
              <p className="personnage-imm__intro-sub">{subline}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {(phase === "actions" || reducedMotion) && (
          <div className="personnage-imm__intro-actions">
            <button type="button" className="personnage-imm__intro-btn personnage-imm__intro-btn--primary" onClick={() => onEnter(true)}>
              {copy.personnageEnterStory}
            </button>
            <button type="button" className="personnage-imm__intro-btn personnage-imm__intro-btn--ghost" onClick={() => onEnter(false)}>
              {copy.personnageSkipIntro}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
