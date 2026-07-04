# Tests FANG

Suite de tests automatisée pour vérifier le bon fonctionnement de
l'application **avant mise en production**.

## Exécution

```bash
# Tout (unitaires + intégration). Sauvegarde automatique de data/ avant.
npm test

# Uniquement les tests unitaires (modules, pas besoin du serveur)
npm run test:unit

# Uniquement les tests d'intégration (HTTP, démarre un serveur isolé)
npm run test:integration
```

## Architecture

```
tests/
├── unit/                       # Tests unitaires de modules (server/lib/*)
│   ├── cms.test.mjs            # CMS — schéma, draft/publish/revert, preview tokens
│   ├── checkoutPending.test.mjs# Registre ref → orderId, idempotence, TTL
│   ├── paytech.test.mjs        # Vérification HMAC SHA256 + amount match
│   ├── paydunya.test.mjs       # Vérification SHA512 + amount match
│   ├── stock.test.mjs          # Réservation atomique via fileLock
│   ├── fileLock.test.mjs       # Verrou de fichier exclusif
│   ├── audit.test.mjs          # Journal d'audit + filtres
│   ├── pages.test.mjs          # Pages éditoriales (CGV, etc.)
│   ├── promos.test.mjs         # Codes promo (percent, fixed, expiration, maxUses)
│   └── orders.test.mjs         # CRUD commandes, statuts, paiement
├── integration/                # Tests HTTP end-to-end
│   ├── auth.test.mjs           # Auth admin + client (register, login, sessions)
│   ├── store.test.mjs          # Boutique publique (settings, pages, contact, newsletter, shipping)
│   ├── orders.test.mjs         # Commandes (guest, client connecté, admin updates)
│   ├── checkout.test.mjs       # Flow paiement inversé (start → pending → confirmed)
│   ├── cms.test.mjs            # CMS complet (PATCH → preview → publish → public)
│   ├── admin.test.mjs          # Catalogue, settings, audit, backups, rapports
│   ├── seo.test.mjs            # robots.txt, sitemap.xml
│   └── security.test.mjs       # Headers, XSS, IPN signature, payload limits
└── helpers/
    ├── http.mjs                # Wrappers fetch (admin + client) + login
    └── fixtures.mjs            # buildOrderPayload (avec devis shipping calculé)
```

## Orchestrateur (`scripts/test-runner.mjs`)

1. Sauvegarde `data/` vers `data.testbackup-{ts}/`.
2. Vide `data/`.
3. Lance les tests unitaires (Node `node:test`).
4. Vide à nouveau `data/`.
5. Démarre un serveur HTTP isolé sur un port libre, avec :
   - `FANG_ADMIN_EMAIL` / `FANG_ADMIN_PASSWORD` éphémères,
   - `CHECKOUT_ALLOW_SIMULATED_PAYMENT=true` pour simuler le paiement,
   - `FANG_DISABLE_BACKUPS=1` et `FANG_DISABLE_RATE_LIMIT=1` pour tests fiables.
6. Attend que `/api/admin/ping` réponde.
7. Lance les tests d'intégration via `node --test`.
8. Tue le serveur et **restaure le `data/` initial** dans tous les cas (y compris
   en cas d'erreur, signal SIGINT, ou exception non capturée).

## Convention de test

Tous les tests utilisent le module natif Node `node:test` (Node ≥ 18). Pas de
dépendance supplémentaire — pas de Jest, pas de Mocha.

```js
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

describe("Mon module", () => {
  it("fait quelque chose", () => {
    assert.equal(1 + 1, 2);
  });
});
```

## Variables d'environnement injectées dans les tests

Le runner injecte automatiquement dans les sous-processus :
- `FANG_TEST_BASE_URL` — URL du serveur (ex. `http://localhost:54321`)
- `FANG_TEST_ADMIN_EMAIL` — email du compte admin éphémère
- `FANG_TEST_ADMIN_PASSWORD` — mot de passe du compte admin éphémère

Ces variables sont lues par `tests/helpers/http.mjs`.

## Couverture

- **Unit (82 tests)** : 100 % des modules `server/lib/*.mjs` critiques pour la
  prod (paiement, stock, audit, promos, commandes, CMS, pages, fileLock,
  checkoutPending).
- **Intégration (100 tests)** :
  - Auth admin + client + sécurité (401, tokens invalides, logout).
  - Flow paiement inversé (création pending → confirmation IPN).
  - CMS draft/publish/revert/preview avec live preview.
  - Commandes invité + client connecté + suivi.
  - Robots.txt + sitemap.xml.
  - Headers sécurité, XSS, IPN replay, limites payload.

## Ajouter un test

1. Créer `tests/unit/mon-test.test.mjs` ou `tests/integration/mon-test.test.mjs`.
2. Utiliser les helpers `http`, `adminFetch`, `buildOrderPayload`.
3. Lancer `npm test` pour exécuter la suite complète.

## CI

Pour intégrer dans une CI (GitHub Actions, etc.) :

```yaml
- name: Tests
  run: npm test
```

Le runner ne nécessite aucun service externe (pas de DB, pas de Redis). Tous
les modules persistent dans `data/*.json`, isolés par le runner.

## Mode dégradé

Si le serveur ne démarre pas dans les 15 s (port occupé, erreur de boot), le
runner échoue avec exit code `2` et logue le `stdout`/`stderr` du serveur.
