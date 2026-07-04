import { copy } from "@/content/copy";
import type { Chapter, ChapterNarrativeArtifact, ChapterNarrativeOverrides } from "@/content/chapters";

export type ResolvedChapterNarrative = {
  cinematicLine: string;
  cinematicSubline: string;
  eraPlace: string;
  worldHeadline: string;
  worldIntro: string;
  challengeLine: string;
  decisiveTitle: string;
  decisiveBody: string;
  griotVoice: string;
  closingLine: string;
  artifacts: ChapterNarrativeArtifact[];
};

function defaultArtifacts(ch: Chapter): ChapterNarrativeArtifact[] {
  return [
    {
      id: "role",
      glyph: "◇",
      label: "Rôle sur la scène",
      story: ch.role,
    },
    {
      id: "sense",
      glyph: "◎",
      label: "Ce que le nom porte",
      story: `${ch.meaning} — ${ch.intention}`,
    },
    {
      id: "voice",
      glyph: "❝",
      label: "Une phrase qui tient",
      story: ch.quote,
    },
    {
      id: "wear",
      glyph: "✦",
      label: "La pièce liée au récit",
      story: ch.wear,
    },
  ];
}

export function resolveChapterNarrative(chapter: Chapter): ResolvedChapterNarrative {
  const n: ChapterNarrativeOverrides | undefined = chapter.narrative;

  const eraPlace =
    n?.eraPlace ??
    `${chapter.moodTags.slice(0, 2).join(" · ")} — Chapitre ${chapter.index}`;

  const worldIntro =
    n?.worldIntro ??
    `${chapter.body}\n\n${chapter.meaning} : ${chapter.intention}`;

  const decisiveBody =
    n?.decisiveBody ??
    `${chapter.intention}\n\nOn raconte que les grandes silhouettes ne tiennent pas seulement par le tissu : elles tiennent par la mémoire du geste et le refus de disparaître.`;

  const griotVoice =
    n?.griotVoice ??
    `On raconte que les grands récits ne naissent pas seulement par les armes ou le commerce. Ils naissent aussi par la parole, la mémoire et le courage de ceux qui refusent d’être effacés.\n\n« ${chapter.quote} »`;

  const closingLine =
    n?.closingLine ??
    `Tant que cette histoire sera racontée, le chapitre « ${chapter.name} » ne sera jamais totalement refermé.`;

  return {
    cinematicLine: n?.cinematicLine ?? copy.personnageCinematicLine,
    cinematicSubline: n?.cinematicSubline ?? copy.personnageCinematicSub,
    eraPlace,
    worldHeadline: n?.worldHeadline ?? "Arrivée dans son univers",
    worldIntro,
    challengeLine: n?.challengeLine ?? chapter.intention,
    decisiveTitle: n?.decisiveTitle ?? "Le moment où tout se joue",
    decisiveBody,
    griotVoice,
    closingLine,
    artifacts: n?.artifacts?.length ? n.artifacts : defaultArtifacts(chapter),
  };
}
