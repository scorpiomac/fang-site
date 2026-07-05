import { useEffect, useId, useRef, useState } from "react";

type Props = {
  id: string;
  label: string;
  options: string[];
  value: string[];
  onChange: (countries: string[]) => void;
};

export function CountryMultiSelect({ id, label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (country: string) => {
    if (value.includes(country)) {
      const next = value.filter((c) => c !== country);
      onChange(next.length > 0 ? next : [country]);
      return;
    }
    onChange([...value, country]);
  };

  const displayValue =
    value.length > 0 ? value.join(", ") : "Sélectionner un ou plusieurs pays";

  return (
    <div className="checkout-countries" ref={rootRef}>
      <label className="checkout-countries__label" htmlFor={`${id}-trigger`}>
        {label}
      </label>
      <div className="checkout-countries__field">
        <button
          id={`${id}-trigger`}
          type="button"
          className={`checkout-countries__trigger${open ? " is-open" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span
            className={`checkout-countries__value${
              value.length === 0 ? " is-placeholder" : ""
            }`}
          >
            {displayValue}
          </span>
          <svg
            className="checkout-countries__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open ? (
          <ul
            className="checkout-countries__list"
            id={listId}
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
          >
            {options.map((country) => {
              const selected = value.includes(country);
              return (
                <li key={country} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`checkout-countries__option${
                      selected ? " is-selected" : ""
                    }`}
                    onClick={() => toggle(country)}
                  >
                    <span className="checkout-countries__check" aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                    {country}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
