import { useState } from "react";
import { fileUrlFromPath } from "../api";
import { MediaPicker } from "./MediaPicker";

type Props = {
  label: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  pickerTitle?: string;
  pickerHelper?: string;
  hint?: string;
};

export function MediaSlot({ label, value, onChange, pickerTitle, pickerHelper, hint }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-slot">
      <div className="admin-slot__head">
        <span className="admin-form__label">{label}</span>
        {hint ? <span className="admin-slot__hint">{hint}</span> : null}
      </div>
      <div className="admin-slot__body">
        <div className={`admin-slot__preview${value ? "" : " is-empty"}`}>
          {value ? <img src={fileUrlFromPath(value)} alt="" /> : <span>Pas d'image</span>}
        </div>
        <div className="admin-slot__actions">
          <button
            type="button"
            className="admin-cta admin-cta--small"
            onClick={() => setOpen(true)}
          >
            {value ? "Changer" : "Choisir depuis la médiathèque"}
          </button>
          {value ? (
            <button
              type="button"
              className="admin-cta admin-cta--small admin-cta--ghost"
              onClick={() => onChange(null)}
            >
              Retirer
            </button>
          ) : null}
        </div>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(paths) => {
          setOpen(false);
          onChange(paths[0] ?? null);
        }}
        singleSelect
        title={pickerTitle ?? `Choisir : ${label}`}
        helper={pickerHelper ?? "Cliquez sur la photo à utiliser."}
        confirmLabel="Utiliser"
        excludeHashes={[]}
      />
    </div>
  );
}
