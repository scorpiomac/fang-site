import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(path.resolve(__dirname, "../../data"), "pages.json");

export const DEFAULT_PAGES = {
  cgv: {
    slug: "cgv",
    title: "Conditions Générales de Vente",
    intro: "Les présentes Conditions Générales de Vente régissent toutes les ventes effectuées via le site FANG.",
    body: `1. PRÉAMBULE
Le site est édité par FANG (Fallou Ngom), atelier basé à Dakar, Sénégal.

2. PRODUITS
Les produits proposés sont fabriqués artisanalement à Dakar. Les images sont non contractuelles ; chaque pièce peut présenter de légères variations dues à la confection à la main.

3. COMMANDE
Toute commande implique l'acceptation pleine et entière des présentes CGV.

4. PRIX
Les prix sont indiqués en FCFA (XOF) TTC. Les éventuels frais de livraison sont indiqués lors du checkout.

5. PAIEMENT
Le paiement peut s'effectuer par Mobile Money, virement bancaire ou autres moyens proposés. La commande n'est confirmée qu'après réception du paiement.

6. LIVRAISON
Les délais de production sont indiqués sur chaque pièce. La livraison s'effectue selon la zone choisie.

7. DROIT DE RÉTRACTATION
Conformément à la loi, le client dispose d'un droit de rétractation. Voir notre politique de retour.

8. RESPONSABILITÉ
FANG ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du site.

9. PROPRIÉTÉ INTELLECTUELLE
Tous les contenus (images, textes, designs) sont la propriété exclusive de FANG.

10. LOI APPLICABLE
Le présent contrat est soumis au droit sénégalais.`,
    enabled: true,
    updatedAt: null,
  },
  confidentialite: {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    intro: "Nous prenons la confidentialité de vos données très au sérieux.",
    body: `DONNÉES COLLECTÉES
Nous collectons uniquement les données nécessaires au traitement de vos commandes : nom, e-mail, téléphone, adresse de livraison.

UTILISATION
Vos données sont utilisées exclusivement pour traiter vos commandes et vous informer sur l'évolution de la marque (avec votre consentement explicite pour la newsletter).

PARTAGE
Nous ne partageons vos données qu'avec nos transporteurs (pour livraison) et nos prestataires de paiement.

DURÉE DE CONSERVATION
Les données client sont conservées 3 ans après votre dernière commande.

VOS DROITS
Conformément au RGPD : accès, rectification, suppression, portabilité, opposition. Pour exercer ces droits, écrivez à notre adresse de contact.

COOKIES
Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement du site (panier, session). Aucun cookie publicitaire tiers.

SÉCURITÉ
Vos mots de passe sont hachés avec scrypt. Les sessions sont protégées par tokens uniques.`,
    enabled: true,
    updatedAt: null,
  },
  "mentions-legales": {
    slug: "mentions-legales",
    title: "Mentions légales",
    intro: "Informations légales relatives à l'éditeur du site.",
    body: `ÉDITEUR
{{legalName}}
{{address}}

CONTACT
E-mail : {{contactEmail}}
Téléphone : {{contactPhone}}

HÉBERGEUR
[À compléter avec les informations de votre hébergeur]

DIRECTEUR DE PUBLICATION
Fallou Ngom

CRÉDITS
Conception et développement : équipe FANG.

PROPRIÉTÉ INTELLECTUELLE
L'ensemble du contenu de ce site (textes, images, vidéos, design) est protégé par les lois sur la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation écrite.`,
    enabled: true,
    updatedAt: null,
  },
  faq: {
    slug: "faq",
    title: "Foire aux questions",
    intro: "Toutes les réponses à vos questions sur la commande, la production et la livraison.",
    body: `## Combien de temps prend la production ?
Chaque pièce est confectionnée à la main à Dakar. Le délai est généralement de 2 à 6 semaines selon la complexité.

## Puis-je commander sur mesure ?
Oui. Précisez vos besoins lors du checkout dans le champ "Note pour l'atelier" et nous reviendrons vers vous.

## Quels modes de paiement acceptez-vous ?
Wave, Orange Money, virement bancaire, espèces (à Dakar) — voir l'étape paiement du checkout.

## Livrez-vous à l'international ?
Oui, à partir des zones internationales. Délais 7-14 jours.

## Puis-je échanger ou retourner une pièce ?
Voir notre politique de retours.

## Comment suivre ma commande ?
Depuis votre espace client si vous avez un compte. Sinon avec votre N° de commande et e-mail sur la page "Suivi commande".

## Vos pièces sont-elles fabriquées au Sénégal ?
100 %. Coupe, couture, finitions, broderies — tout est fait dans notre atelier à Dakar.

## Avez-vous une boutique physique ?
Pour l'instant, nous fonctionnons sur rendez-vous à Dakar. Écrivez-nous pour fixer une visite.`,
    enabled: true,
    updatedAt: null,
  },
  retours: {
    slug: "retours",
    title: "Retours & échanges",
    intro: "Notre politique pour les retours et les échanges.",
    body: `DÉLAI DE RÉTRACTATION
Conformément à la loi, vous disposez de 14 jours après réception pour exercer votre droit de rétractation.

CONDITIONS
Les pièces doivent être retournées :
- non portées
- avec leurs étiquettes
- dans leur emballage d'origine

PIÈCES SUR MESURE
Les pièces sur mesure et personnalisées ne sont pas éligibles au retour (sauf défaut).

PROCÉDURE
1. Contactez-nous à l'adresse contact pour ouvrir un retour.
2. Nous vous fournissons les instructions d'expédition.
3. Une fois la pièce reçue et vérifiée, nous procédons au remboursement sous 14 jours.

FRAIS DE RETOUR
Les frais de retour sont à votre charge sauf en cas de défaut ou d'erreur de notre part.

ÉCHANGE TAILLE
Possible une fois par commande, sous réserve de disponibilité.`,
    enabled: true,
    updatedAt: null,
  },
  "guide-tailles": {
    slug: "guide-tailles",
    title: "Guide des tailles",
    intro: "Mesures indicatives pour bien choisir.",
    body: `Pour des conseils personnalisés, écrivez-nous avec vos mesures (poitrine, taille, hanches) — toutes les morphologies bienvenues.

| Taille | Poitrine (cm) | Taille (cm) | Hanches (cm) |
|--------|--------------|-------------|--------------|
| XS     | 80–84        | 60–64       | 86–90        |
| S      | 84–88        | 64–68       | 90–94        |
| M      | 88–94        | 68–74       | 94–100       |
| L      | 94–100       | 74–80       | 100–106      |
| XL     | 100–108      | 80–88       | 106–114      |
| XXL    | 108–116      | 88–96       | 114–122      |

Tous nos vêtements sont produits à la main et peuvent être adaptés. Mentionnez vos contraintes (longueur de manche, ourlet, etc.) dans la note de commande.`,
    enabled: true,
    updatedAt: null,
  },
  about: {
    slug: "about",
    title: "À propos",
    intro: "FANG — Maison afro-contemporaine née à Dakar.",
    body: `FANG, en wolof, signifie exposition. Mais pour nous, c'est une philosophie.

Peu importe ta morphologie. Ton genre. Ta culture. Ose t'exposer. Tu es beau. Tu es toi. C'est suffisant.

FANG est une maison sénégalaise de mode afro-contemporaine. Notre saison 01, Nel Fang Te Dundu, raconte sept chapitres à travers sept personnages réels portés par sept silhouettes produites à Dakar.

NOTRE ENGAGEMENT
- Production 100 % à Dakar
- Tissus locaux et matières durables
- Sur-mesure et adaptation possibles
- Confection à la main, en petites séries

NOTRE FONDATEUR
Fallou Ngom, créateur et directeur artistique.

NOTRE RECONNAISSANCE
Sélectionnée parmi les 10 meilleures maisons africaines lors du concours officiel des Jeux Olympiques de la Jeunesse de Dakar 2026, sur 200 participants.`,
    enabled: true,
    updatedAt: null,
  },
};

ensureFile(FILE, DEFAULT_PAGES);

function load() {
  const stored = readJson(FILE, {});
  const merged = { ...DEFAULT_PAGES };
  for (const slug of Object.keys(DEFAULT_PAGES)) {
    if (stored[slug]) {
      merged[slug] = { ...DEFAULT_PAGES[slug], ...stored[slug] };
    }
  }
  // Pages custom ajoutées par l'admin
  for (const slug of Object.keys(stored)) {
    if (!DEFAULT_PAGES[slug]) merged[slug] = stored[slug];
  }
  return merged;
}

function save(data) {
  writeJson(FILE, data);
}

export function listPages() {
  return Object.values(load());
}

export function getPage(slug) {
  return load()[slug] ?? null;
}

export function updatePage(slug, patch) {
  const data = load();
  const existing = data[slug];
  if (!existing) return { error: "Page introuvable" };
  const next = { ...existing, ...patch, slug, updatedAt: new Date().toISOString() };
  data[slug] = next;
  save(data);
  return { page: next };
}
