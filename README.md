# Devis & Factures — SaaS auto-entrepreneurs / TPE françaises

## Stack

- **Next.js 14** (App Router, TypeScript) — frontend + backend unifiés
- **PostgreSQL + Prisma** — base de données
- **Auth.js (NextAuth v5)** — email/mot de passe + OAuth Google
- **@react-pdf/renderer** — génération PDF côté serveur
- **Vitest** — tests unitaires (priorité absolue : calculs financiers)
- **Tailwind CSS** — UI, accessibilité WCAG AA

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
      atomique, snapshots) — **pas encore d'interface ni d'actions serveur**
- [x] Numérotation atomique (`src/lib/numbering.ts`) + contrôle de conformité
      avant émission (`src/lib/invoice-compliance.ts`), avec tests
- [x] Immutabilité en base : `prisma/sql/immutability.sql` (triggers à
      appliquer après `prisma migrate`)
- [ ] Interface devis / factures (formulaires, listes)
- [ ] Génération PDF conforme
- [ ] Envoi par email + relances automatiques
- [ ] Avoirs (correction de facture émise)
- [ ] Export comptable CSV/Excel

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
5. **RGPD global** : le logiciel fournira les fonctionnalités techniques
   (export, suppression de compte), mais la conformité RGPD complète (base
   légale du traitement, registre des traitements, DPA avec les
   sous-traitants email/hébergement) reste une responsabilité juridique de
   l'éditeur du SaaS, pas uniquement une fonctionnalité logicielle.
7. **Suppression de compte vs conservation légale** : les factures doivent
   être conservées 10 ans (Code de commerce), ce qui entre en tension avec le
   droit à l'effacement RGPD. Les triggers bloquent la suppression des
   factures émises : la suppression de compte devra anonymiser/archiver
   plutôt que supprimer. Arbitrage à valider par un juriste.
6. **Exactitude des mentions selon la forme juridique** : le logiciel
   applique des règles génériques par forme juridique (RCS, capital social)
   mais ne peut pas vérifier l'exactitude juridique des informations
   saisies par l'utilisateur.
