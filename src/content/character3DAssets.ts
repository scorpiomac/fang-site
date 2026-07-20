import { collectionChapters } from "@/content/collectionCatalog";
import { getCharacterProfile } from "@/content/characterProfiles";

/** Rendu 3D turntable — dossier sous public/collection/s01/_3d-renders/ */
export type Character3DClip = {
  /** Slug archétype (characterProfiles + atelier) */
  characterSlug: string;
  /** Dossier extrait des vidéos (clip-01 … clip-06) */
  clipId: string;
  frameCount: number;
};

/**
 * Correspondance clip vidéo → archétype.
 * Ajuster si un nom sur le socle 3D ne correspond pas.
 */
export const character3DClips: Character3DClip[] = [
  { characterSlug: "gue-am", clipId: "clip-01", frameCount: 12 },
  { characterSlug: "racine", clipId: "clip-02", frameCount: 12 },
  { characterSlug: "fod", clipId: "clip-03", frameCount: 12 },
  { characterSlug: "mossane", clipId: "clip-04", frameCount: 12 },
  { characterSlug: "jant", clipId: "clip-05", frameCount: 12 },
  { characterSlug: "miik", clipId: "clip-06", frameCount: 12 },
];

export type Character3DRosterEntry = Character3DClip & {
  name: string;
  meaning: string;
  excerpt: string;
  description: string;
  chapterSlug: string;
  chapterName: string;
  coverPath: string;
  framePath: (index: number) => string;
};

export function frameAssetPath(clipId: string, index: number): string {
  const n = String(index + 1).padStart(2, "0");
  return `collection/s01/_3d-renders/${clipId}/frame-${n}.webp`;
}

export function coverAssetPath(clipId: string): string {
  return `collection/s01/_3d-renders/${clipId}/cover.webp`;
}

export function getPrimaryChapterForCharacter(characterSlug: string): {
  chapterId: string;
  chapterSlug: string;
  chapterName: string;
} | null {
  for (const chapter of collectionChapters) {
    if (chapter.characters.some((c) => c.slug === characterSlug)) {
      return {
        chapterId: chapter.id,
        chapterSlug: chapter.slug,
        chapterName: chapter.name,
      };
    }
  }
  return null;
}

export function getCharacter3DRoster(): Character3DRosterEntry[] {
  return character3DClips.flatMap((clip) => {
    const profile = getCharacterProfile(clip.characterSlug);
    const chapter = getPrimaryChapterForCharacter(clip.characterSlug);
    if (!profile || !chapter) return [];

    return [
      {
        ...clip,
        name: profile.name,
        meaning: profile.meaning,
        excerpt: profile.excerpt,
        description: profile.description,
        chapterSlug: chapter.chapterSlug,
        chapterName: chapter.chapterName,
        coverPath: coverAssetPath(clip.clipId),
        framePath: (index: number) => frameAssetPath(clip.clipId, index),
      },
    ];
  });
}
