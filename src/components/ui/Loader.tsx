import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";

type Props = {
  onDone: () => void;
};

export function Loader({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  const target = useMemo(() => 0.94, []);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setProgress((p) => Math.min(p + 0.018 + Math.random() * 0.02, target));
    };
    const id = window.setInterval(tick, 110);

    const fonts = document.fonts?.ready ?? Promise.resolve();
    const min = new Promise<void>((r) => window.setTimeout(r, 400));

    void Promise.all([fonts, min]).then(() => {
      if (!mounted) return;
      window.clearInterval(id);
      setProgress(1);
      window.setTimeout(() => {
        setHidden(true);
        window.setTimeout(onDone, 400);
      }, 280);
    });

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [onDone, target]);

  return (
    <AnimatePresence>
      {!hidden ? (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(14px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="loader__inner">
            <p className="loader__sub-top">Maison sénégalaise</p>
            <div className="loader__brand-row">
              <img src={publicUrl("logo/fang-logo-1.png")} alt="" className="loader__logo" />
              <p className="loader__title">{copy.brand}</p>
            </div>
            <p className="loader__wolof">{copy.tagline}</p>
            <p className="loader__subtitle">— {copy.loading}</p>
            <div className="loader__bar" aria-hidden="true">
              <motion.div
                className="loader__bar-fill"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ type: "spring", stiffness: 130, damping: 24 }}
              />
            </div>
            <p className="loader__pct">
              {String(Math.round(progress * 100)).padStart(3, "0")}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
