import { useMemo, useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Fallback unique si la chaîne est épuisée */
  fallbackSrc?: string;
  /** Fallbacks essayés dans l'ordre après src */
  fallbacks?: readonly (string | null | undefined)[];
};

export function MediaImage({
  src,
  fallbackSrc,
  fallbacks = [],
  onError,
  alt = "",
  ...props
}: Props) {
  const chain = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const candidate of [src, ...fallbacks, fallbackSrc]) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      list.push(candidate);
    }
    return list;
  }, [src, fallbackSrc, fallbacks]);

  const [index, setIndex] = useState(0);
  const current = chain[Math.min(index, chain.length - 1)] ?? "";

  if (!current) return null;

  return (
    <img
      {...props}
      alt={alt}
      src={current}
      onError={(event) => {
        if (index < chain.length - 1) {
          setIndex((i) => i + 1);
        } else {
          onError?.(event);
        }
      }}
    />
  );
}
