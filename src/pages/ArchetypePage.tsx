import { CharacterRosterSection } from "@/components/collection/CharacterRosterSection";
import { FooterSection } from "@/sections/FooterSection";

export function ArchetypePage() {
  return (
    <>
      <main id="contenu-principal" className="archetype-page">
        <CharacterRosterSection />
      </main>
      <FooterSection />
    </>
  );
}
