export const FRANCHISE_VAT_MENTION = "TVA non applicable, art. 293B du CGI";
export const MIN_RECOVERY_INDEMNITY_CENTS = 4000;

const LEGAL_FORMS_WITH_RCS = ["EURL", "SARL", "SASU", "SAS"];

export interface SellerSnapshot {
  legalName: string;
  legalForm: string;
  siren: string;
  siret: string;
  vatRegime: "FRANCHISE_EN_BASE" | "REEL_SIMPLIFIE" | "REEL_NORMAL";
  vatNumber?: string | null;
  rcsCity?: string | null;
  rcsNumber?: string | null;
  shareCapitalCents?: number | null;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
}

export interface BuyerSnapshot {
  type: "INDIVIDUAL" | "BUSINESS";
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface ComplianceInput {
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  issueDate: Date;
  dueDate: Date;
  lines: Array<{
    description: string;
    quantity: number | string;
    unitPriceCents: number;
    vatRatePer100000: number;
  }>;
  latePenaltyRateText?: string | null;
  recoveryIndemnityCents?: number | null;
  discountPolicyText?: string | null;
}

/** Retourne la liste des problèmes bloquant l'émission, en français clair. Vide = conforme. */
export function validateInvoiceForEmission(input: ComplianceInput): string[] {
  const errors: string[] = [];
  const { seller, buyer, lines } = input;
  const blank = (v?: string | null) => !v || v.trim() === "";

  if (blank(seller.legalName)) errors.push("Il manque la raison sociale de votre entreprise.");
  if (blank(seller.legalForm)) errors.push("Il manque la forme juridique de votre entreprise.");
  if (!/^\d{9}$/.test(seller.siren ?? "")) errors.push("Votre SIREN doit contenir 9 chiffres.");
  if (!/^\d{14}$/.test(seller.siret ?? "")) errors.push("Votre SIRET doit contenir 14 chiffres.");
  if (blank(seller.addressLine1) || blank(seller.postalCode) || blank(seller.city)) {
    errors.push("L'adresse complète de votre entreprise est incomplète.");
  }
  if (LEGAL_FORMS_WITH_RCS.includes(seller.legalForm) && (blank(seller.rcsCity) || blank(seller.rcsNumber))) {
    errors.push("Il manque votre numéro RCS et la ville d'immatriculation.");
  }
  if (seller.vatRegime !== "FRANCHISE_EN_BASE" && blank(seller.vatNumber)) {
    errors.push("Il manque votre numéro de TVA intracommunautaire.");
  }
  if (seller.vatRegime === "FRANCHISE_EN_BASE" && lines.some((l) => l.vatRatePer100000 !== 0)) {
    errors.push("Vous êtes en franchise en base de TVA : les lignes ne peuvent pas avoir de TVA.");
  }

  if (blank(buyer.name)) errors.push("Il manque le nom de votre client.");
  if (blank(buyer.addressLine1) || blank(buyer.postalCode) || blank(buyer.city)) {
    errors.push("L'adresse de votre client est incomplète.");
  }

  if (lines.length === 0) errors.push("Ajoutez au moins une ligne à la facture.");
  lines.forEach((line, i) => {
    const n = i + 1;
    if (blank(line.description)) errors.push(`Ligne ${n} : la description est vide.`);
    if (!(Number(line.quantity) > 0)) errors.push(`Ligne ${n} : la quantité doit être supérieure à 0.`);
    if (line.unitPriceCents < 0) errors.push(`Ligne ${n} : le prix unitaire ne peut pas être négatif.`);
  });

  if (input.dueDate.getTime() < input.issueDate.getTime()) {
    errors.push("La date d'échéance ne peut pas être avant la date d'émission.");
  }
  if (blank(input.latePenaltyRateText)) errors.push("Il manque la mention des pénalités de retard.");
  if (blank(input.discountPolicyText)) errors.push("Il manque la mention d'escompte (ex : « Escompte non applicable »).");
  if (buyer.type === "BUSINESS" && (input.recoveryIndemnityCents ?? 0) < MIN_RECOVERY_INDEMNITY_CENTS) {
    errors.push("L'indemnité forfaitaire de recouvrement doit être de 40 € entre professionnels.");
  }

  return errors;
}

export function vatMention(seller: Pick<SellerSnapshot, "vatRegime" | "vatNumber">): string {
  return seller.vatRegime === "FRANCHISE_EN_BASE"
    ? FRANCHISE_VAT_MENTION
    : `N° TVA intracommunautaire : ${seller.vatNumber ?? ""}`;
}
