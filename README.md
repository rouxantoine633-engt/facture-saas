# Devis & Factures — SaaS auto-entrepreneurs / TPE françaises

## Stack

- **Next.js 16** (App Router, TypeScript, React 19) — frontend + backend unifiés
- **PostgreSQL + Prisma** — base de données
- **Auth.js (NextAuth v5)** — email/mot de passe + OAuth Google
- **@react-pdf/renderer** — génération PDF côté serveur
- **Vitest** — tests unitaires (priorité absolue : calculs financiers)
- **Tailwind CSS** — UI, accessibilité WCAG AA

## État de la vérification (première exécution réelle)

Le 2026-09-27, Node a été installé et le projet exécuté pour la première fois :
`npm install`, `npm test` (110 tests, tous passants), `npx tsc --noEmit` et
`npm run build` passent tous sans erreur. Un bug réel a été corrigé à cette
occasion : `useSearchParams()` sur `/connexion` nécessitait une limite
`Suspense` pour le pré-rendu Next.js.

`npm audit` signale des vulnérabilités connues sur les dépendances :
- **Corrigé** : `next-auth` était vulnérable à un contournement d'email par
  homoglyphes Unicode (critique) — mis à jour vers `5.0.0-beta.32`. `next` mis
  à jour vers `14.2.35` (dernier correctif sans changement de version majeure).
- **Corrigé (2026-09-27, suite)** : passage à **Next.js 16** + **React 19** +
  **ESLint 9** (voir section suivante) — toutes les failles Next.js listées
  ci-dessus (DoS, RCE potentielles) sont couvertes par cette version.
- **Non corrigé, dev uniquement, sans exposition en production** : des
  vulnérabilités modérées/critique dans `vitest`/`esbuild`/`vite` (le test
  runner), qui imposeraient de casser la version majeure de `vitest` (2.x → 4.x).

## Migration Next.js 14 → 16 (2026-09-27)

Faite pour corriger les failles de sécurité ci-dessus. Points bloquants
rencontrés et résolus :

- **`params` asynchrone** : Next 15+ impose `params: Promise<{ id: string }>`
  (et `await params`) dans les pages et route handlers dynamiques — corrigé
  dans les 7 fichiers `[id]/...` concernés (devis, factures, avoirs).
- **`next.config.mjs`** : `experimental.serverComponentsExternalPackages` a
  été renommé `serverExternalPackages` (option top-level).
- **ESLint 9** : `eslint-config-next@16` exige `eslint >= 9` ; aucun fichier
  de config ESLint n'existait dans le projet, donc aucune migration de règles
  n'a été nécessaire.
- **Turbopack (mode dev) indisponible sur cette machine** : `next dev` utilise
  Turbopack par défaut depuis Next 16, qui plante au démarrage ici
  (`spawning node pooled process — No such file or directory`), probablement
  à cause de l'installation Node non standard (voir plus haut, pas de
  Homebrew). `npm run dev` et `.claude/launch.json` utilisent donc
  `next dev --webpack`. **`next build` utilise Turbopack sans problème** : la
  build de production n'est pas concernée par ce contournement.
- **Génération PDF cassée par un conflit de versions React (bug réel, corrigé)** :
  après la migration, `/factures/[id]/pdf` (et devis/avoirs) renvoyaient une
  erreur 500 (« Minified React error #31 »). Cause : Next 16 utilise React 19
  en interne pour son runtime serveur, alors que le projet était resté en
  React 18 — `@react-pdf/renderer` (chargé hors bundle via
  `serverExternalPackages`) se retrouvait avec deux instances de React
  différentes dans le même rendu. Confirmé comme un problème connu de
  l'écosystème (voir [react-pdf#3074](https://github.com/diegomura/react-pdf/issues/3074)).
  **Corrigé** en alignant tout le monde sur React 19 : `react`/`react-dom`
  19.3.0, `@react-pdf/renderer` 3.4.5 → **4.9.0** (première version à déclarer
  officiellement React 19 en peer dependency).

Vérifié après migration : `npm test` (110 tests), `npx tsc --noEmit`,
`npm run build` (Turbopack), puis en conditions réelles dans le navigateur
(serveur `--webpack`) — page facture dynamique, les 3 routes PDF
(devis/facture/avoir), et création d'un devis via un formulaire React Hook
Form. Tout fonctionne.

## Vérification contre une vraie base (2026-09-27)

La migration Prisma a été exécutée pour de vrai contre un PostgreSQL 17 local
(`npx prisma migrate dev --name init`, dossier `prisma/migrations/`), suivie
de l'application des triggers d'immutabilité (`prisma/sql/immutability.sql`).
Un script de contrôle (`npm run smoke`, `scripts/smoke-test.mjs`) vérifie
contre la vraie base : numérotation séquentielle sans trou, verrouillage
d'une facture après émission, blocage de sa modification et de sa
suppression par les triggers SQL. Tout est passé au premier essai. Ce script
crée des données de test dans la base ; à ne lancer que sur une base de
développement.

## Vérification dans le navigateur (2026-09-27)

Parcours complet testé pour de vrai avec le serveur de dev et PostgreSQL
local, avant et après la migration Next 16 :

- **Inscription / connexion** : compte créé, mot de passe haché en base,
  connexion réussie avec redirection vers la configuration entreprise
  (aucun profil n'existe encore), message d'erreur générique sur mot de
  passe incorrect (pas de fuite d'info).
- **Devis → facture** : profil entreprise, client, devis à lignes multiples
  avec totaux calculés en direct, conversion en facture brouillon (référence
  au devis d'origine correcte), émission (numéro définitif, toutes les
  mentions légales affichées), PDF téléchargé sans erreur pour les trois
  types de documents.
- **Immutabilité** : `UPDATE`/`DELETE` en SQL brut directement contre la
  facture émise, tous deux rejetés par les triggers PostgreSQL — la
  protection tient même en contournant complètement l'application.
- **Avoir** : avoir partiel créé sur la facture émise (numérotation propre
  `AV-...`), plafond du montant créditable correctement appliqué et affiché,
  bouton d'émission désactivé au-delà.
- **Paiement** : marquage du solde restant (après avoir) comme payé, la
  facture passe bien au statut « Payée ».
- **Paiements partiels (2026-09-27, suite)** : deux paiements successifs
  (50 € puis 70 € sur une facture de 120 €) — statut « Partiellement payée »
  puis « Payée », historique affiché, solde recalculé et reprérempli à
  chaque fois. Un montant dépassant le solde restant est rejeté côté serveur
  avec un message clair. Le journal des ventes et celui des encaissements
  reflètent correctement les deux paiements distincts.
- **Modification d'un devis brouillon (2026-09-27, suite)** : devis créé,
  ligne modifiée et ligne ajoutée, totaux recalculés (345,50 €), numéro
  conservé. Une fois converti en facture, l'accès direct à l'URL de
  modification affiche bien « n'est plus un brouillon » au lieu du
  formulaire.
- **Export comptable** : contenu du CSV vérifié directement (pas seulement
  téléchargé) — BOM UTF-8 présent dans les octets réels, montants en
  virgule décimale, avoir exporté en négatif avec référence à la facture
  rectifiée, journal des encaissements correct.
- **Email** : sans `BREVO_API_KEY`, message d'erreur clair affiché (« pas
  encore configuré »). Avec une fausse clé, la requête atteint réellement
  l'API Brevo (401 « Key not found » dans les logs serveur) et l'erreur est
  gérée proprement côté UI — confirme que tout le code (PDF, pièce jointe,
  appel réseau, gestion d'erreur) fonctionne ; seule la délivrance réelle
  reste à vérifier avec une vraie clé Brevo.

## Démarrage

Prérequis : Node.js 20+, une base PostgreSQL (locale ou hébergée type Neon/Supabase).

```bash
npm install
cp .env.example .env   # puis renseigner DATABASE_URL, AUTH_SECRET, etc.
npm run prisma:migrate
npm run dev
```

Lancer les tests :

```bash
npm test
```

## État d'avancement du MVP

- [x] Modèle de données (Prisma) — utilisateurs, entreprise, clients, devis,
      factures, avoirs, paiements, relances, compteurs, audit log
- [x] Moteur de calcul HT/TVA/TTC (`src/lib/money.ts`) + suite de tests
      (arrondis, gros montants, ventilation multi-taux)
- [x] Authentification email/mot de passe + Google OAuth
- [x] Profil entreprise (formulaire complet, validation stricte)
- [x] Services métier (`src/lib/documents.ts`) : création de devis, conversion
      devis → facture brouillon, émission (contrôle de conformité, numéro
      atomique, snapshots), suppression de brouillon, enregistrement du paiement
- [x] Numérotation atomique (`src/lib/numbering.ts`) + contrôle de conformité
      avant émission (`src/lib/invoice-compliance.ts`), avec tests
- [x] Immutabilité en base : `prisma/sql/immutability.sql` (triggers à
      appliquer après `prisma migrate`)
- [x] Interface : clients, devis (formulaire à lignes multiples avec totaux en
      direct, liste, détail), conversion en facture, factures (liste, détail
      avec mentions légales figées, émission, suppression de brouillon,
      paiements partiels avec historique et solde restant), tableau de bord
      par statut
- [x] Modification d'un devis brouillon (`/devis/[id]/modifier`, `QuoteForm`
      partagé avec la création) : bloquée dès que le devis n'est plus un
      brouillon, aussi bien côté page que côté service (`updateQuote`)
- [ ] Changement manuel de statut d'un devis (accepté/refusé/expiré) — pour
      l'instant seul l'envoi par email (→ Envoyé) et la conversion (→
      Converti) changent le statut automatiquement
- [x] RGPD (`/compte`, `src/lib/gdpr/`) : export de portabilité en JSON (profil,
      entreprise, clients, devis, factures, avoirs) et fermeture de compte —
      suppression totale si rien n'a jamais été émis, sinon anonymisation
      (identité, coordonnées, mot de passe, journal d'audit) en conservant les
      factures/avoirs émis avec leurs mentions figées, comme l'exige leur
      conservation légale de 10 ans
- [x] Génération PDF (devis + factures, `src/lib/pdf/`) : données légales
      assemblées par des fonctions pures testées, rendu React-PDF, filigrane
      « BROUILLON », PDF d'une facture émise rendu depuis ses mentions figées.
      Ce n'est PAS du PDF/A-3 ni du Factur-X (voir points de conformité)
- [x] Envoi par email (Brevo, PDF en pièce jointe, expéditeur plateforme +
      reply-to de l'utilisateur, plafond 20/jour, journal d'audit)
- [x] Relances automatiques : tâche quotidienne `/api/cron/relances` (Vercel Cron,
      protégée par `CRON_SECRET`) qui passe les factures échues en « En retard »
      et envoie les relances aux paliers configurés (défaut J+7 / J+15), avec
      plan pur testé (`src/lib/reminders.ts`), anti-doublon en base et reprise
      des échecs
- [x] Avoirs (`src/lib/credit-notes.ts`, `/avoirs`) : correction totale ou
      partielle d'une facture émise, numérotation propre (AV-), mentions
      vendeur/client reprises de la facture, PDF, envoi par email, triggers SQL
      d'immutabilité, statut de la facture mis à jour, restes à payer et
      relances tenant compte des avoirs
- [x] Export comptable (`/export`) : journal des ventes (factures émises + avoirs
      en négatif, ventilation TVA par taux) et encaissements, en CSV Excel-FR
      (UTF-8 BOM, `;`, virgule décimale) avec protection contre l'injection de
      formules ; clients repris des mentions figées à l'émission

## Principes de conformité appliqués

- **Montants en centimes entiers**, jamais en flottant ; toute division
  intermédiaire passe par `BigInt` avec arrondi "half away from zero"
  (voir `src/lib/money.ts` et sa suite de tests).
- **Aucune donnée légale obligatoire en texte libre** : chaque mention
  (SIRET, régime de TVA, adresse, taux de TVA par ligne...) est un champ
  structuré distinct en base — prépare l'export Factur-X (PDF/A-3 + XML
  UBL/CII) sans refonte du modèle de données.
- **Numérotation chronologique sans trou** : compteur atomique par
  entreprise et par type de document (`DocumentCounter`), incrémenté dans
  une transaction — le moteur d'attribution des numéros reste à
  implémenter (prochaine étape).
- **Immutabilité des factures émises** : le statut `DRAFT` autorise la
  modification/suppression ; tout autre statut doit être verrouillé côté
  application (à implémenter) — seule la création d'un avoir (`CreditNote`)
  pourra corriger une facture émise.
- **Snapshot légal à l'émission** : `sellerLegalSnapshot` /
  `buyerLegalSnapshot` (JSON) figent les mentions obligatoires au moment de
  l'émission, pour qu'une modification ultérieure du profil entreprise ou
  du client n'altère jamais une facture déjà émise.

## ⚠️ Points de conformité à faire valider par un professionnel

Ces points ne peuvent pas être garantis par le seul code — à vérifier avec
un expert-comptable et/ou un juriste avant mise en production :

1. **Régime de TVA déclaré par l'utilisateur** : le logiciel ne vérifie pas
   l'éligibilité réelle à la franchise en base (seuils de chiffre
   d'affaires) — c'est une déclaration de l'utilisateur.
2. **Conformité Factur-X / réforme 2026-2027** : l'architecture est prête à
   accueillir un export XML (UBL/CII) et PDF/A-3, mais ce module n'est pas
   encore développé ni testé contre les spécifications officielles, et
   aucune Plateforme de Dématérialisation Partenaire (PDP) n'est raccordée.
3. **Existence réelle du SIRET/SIREN** : seul le format est validé (9/14
   chiffres), pas l'existence auprès de l'INSEE (nécessiterait un appel à
   l'API Sirene, hors périmètre MVP).
4. **Taux des pénalités de retard** : le texte par défaut référence le taux
   BCE + 10 points, qui évolue — nécessite une maintenance humaine
   périodique, pas une conformité automatique perpétuelle.
5. **RGPD global** : l'export de portabilité et la fermeture de compte sont
   implémentés (points 14-15 ci-dessous), mais la conformité RGPD complète
   (base légale du traitement, registre des traitements, DPA avec les
   sous-traitants email/hébergement) reste une responsabilité juridique de
   l'éditeur du SaaS, pas uniquement une fonctionnalité logicielle.
7. **Suppression de compte vs conservation légale** : résolu par
   anonymisation plutôt que suppression dès qu'une facture ou un avoir a été
   émis (voir point 14) — arbitrage technique qui reste à faire valider par
   un juriste.
8. **PDF non archivé** : le PDF d'une facture émise est régénéré à la demande
   depuis les données figées (rendu déterministe), mais aucun fichier n'est
   conservé (`pdfStorageKey` inutilisé). Si l'archivage à valeur probante d'un
   fichier PDF fixe est exigé, il faudra le stocker à l'émission (R2/S3) ; le
   PDF/A-3 est par ailleurs requis pour Factur-X.
9. **Devis** : ses mentions sont lues depuis le profil entreprise actuel (pas
   de snapshot, contrairement aux factures) ; un devis ancien réimprimé après
   changement de profil reflète donc les informations à jour.
10. **Emails** : `EMAIL_FROM` doit être une adresse/domaine vérifié dans Brevo
    (SPF/DKIM) sinon les messages seront rejetés ou classés en spam. Brevo
    devient un sous-traitant RGPD (DPA à signer, mention dans la politique de
    confidentialité). Une facture est « envoyée » dès son émission ; l'envoi
    effectif par email est tracé dans `audit_logs`, sans preuve de réception.
11. **Relances** : le texte des relances est un modèle générique. La 2e relance
    rappelle pénalités et indemnité de 40 € (client professionnel seulement) ;
    le montant des pénalités n'est pas calculé. Le ton et la valeur juridique
    (mise en demeure = courrier recommandé) sont à valider. Si la tâche
    quotidienne ne tourne pas un jour, seul le palier le plus récent est envoyé.
    Prévoir une supervision de l'échec du cron.
12. **Avoirs** : le plafond est contrôlé sur le montant TTC total, pas ligne à
    ligne ; un avoir peut donc porter sur d'autres lignes/taux que la facture.
    Les montants d'un avoir sont stockés en positif (le document est libellé
    « AVOIR ») : l'export comptable devra les inverser. Aucun remboursement
    n'est géré. Traitement de la TVA d'un avoir sur facture déjà déclarée à
    valider avec l'expert-comptable.
13. **Export comptable** : le format est un journal générique, pas un fichier des
    écritures comptables (FEC) ni un import propre à un logiciel. Le FEC est
    obligatoire en cas de contrôle fiscal pour une comptabilité informatisée :
    à confirmer avec l'expert-comptable (format attendu, comptes, journaux).
    L'export est une aide, pas une pièce comptable certifiée.
14. **RGPD — périmètre de l'anonymisation** : elle couvre profil, entreprise et
    clients. Les paiements (`Payment.reference` peut contenir un numéro de
    chèque) et les avoirs (motif en texte libre) sont conservés tels quels au
    titre des 10 ans, sans passage systématique dessus. Aucun délai de grâce
    ni sauvegarde de secours n'est purgé (hors périmètre technique de ce
    service). Ce mécanisme n'a pas été exécuté ni vérifié faute de Node
    installé sur la machine de développement.
15. **RGPD — reste à faire hors code** : politique de confidentialité, base
    légale de traitement par finalité, registre des traitements, DPA avec
    Brevo (et l'hébergeur base de données), et procédure documentée pour une
    demande d'accès/rectification reçue autrement que via `/compte`.
6. **Exactitude des mentions selon la forme juridique** : le logiciel
   applique des règles génériques par forme juridique (RCS, capital social)
   mais ne peut pas vérifier l'exactitude juridique des informations
   saisies par l'utilisateur.
