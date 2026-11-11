/**
 * Source unique des informations juridiques affichées sur le site (mentions légales, CGU, CGV,
 * confidentialité, cookies). Toute modification d'identité, de prix ou de sous-traitant se fait ici.
 */

export const LEGAL_UPDATED_AT = "11 novembre 2026";

/** Version des conditions acceptées à l'inscription : à changer à chaque modification substantielle des CGU/CGV. */
export const TERMS_VERSION = "2026-11-11";

export const EDITOR = {
  name: "Antoine ROUX",
  status: "entrepreneur individuel",
  siren: "105 801 179",
  address: "4 impasse du Pariou, 63720 Ennezat",
  email: "roux.antoine633@gmail.com",
} as const;

export const SUBSCRIPTION = {
  priceEuros: 39,
  /** Délai légal de rétractation du consommateur (art. L221-18 du Code de la consommation). */
  withdrawalDays: 14,
} as const;

/**
 * Informations que l'éditeur doit renseigner lui-même : elles ne sont déduites de rien et ne doivent
 * jamais être inventées. Tant que la valeur commence par « [ », la page affiche un repère à compléter.
 */
export const TO_COMPLETE = {
  hostName: "[Nom de l'hébergeur du site à compléter, ex. Vercel Inc.]",
  hostAddress: "[adresse de l'hébergeur à compléter]",
  databaseHost: "[nom du fournisseur de la base de données à compléter]",
  consumerMediator: "[Nom, adresse postale et site internet du médiateur de la consommation à compléter]",
} as const;

export const LEGAL_DOCUMENTS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/cgv", label: "CGV et remboursement" },
  { href: "/confidentialite", label: "Confidentialité & RGPD" },
  { href: "/cookies", label: "Cookies" },
  { href: "/accessibilite", label: "Accessibilité" },
] as const;

/** Chemins publics (sans connexion) : pages légales comprises. Utilisé par le middleware d'accès. */
export const PUBLIC_LEGAL_PATHS: string[] = LEGAL_DOCUMENTS.map((d) => d.href);
