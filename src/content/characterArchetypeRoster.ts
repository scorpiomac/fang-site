import { getCharacter3DRoster } from "@/content/character3DAssets";
import { getArchetypeMeta } from "@/content/characterArchetypeMeta";

export function getArchetypeRoster() {
  return getCharacter3DRoster().map((entry) => ({
    ...entry,
    meta: getArchetypeMeta(entry.characterSlug),
  }));
}
