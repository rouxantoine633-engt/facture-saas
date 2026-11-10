import type { OperationCategory } from "@/lib/operation-category";

/**
 * Catégories de transaction de l'e-reporting B2C (flux 10) retenues par l'application.
 * - TLB1 : livraisons de biens soumises à la TVA
 * - TPS1 : prestations de services soumises à la TVA
 * - TNT1 : opérations non soumises à la TVA française
 *
 * TMA1 (régime de la marge) n'est pas géré : l'application n'a pas ce régime.
 */
export const EREPORTING_CATEGORIES = ["TLB1", "TPS1", "TNT1"] as const;
export type EReportingCategory = (typeof EREPORTING_CATEGORIES)[number];

export const EREPORTING_CATEGORY_LABELS: Record<EReportingCategory, string> = {
  TLB1: "Livraisons de biens soumises à la TVA",
  TPS1: "Prestations de services soumises à la TVA",
  TNT1: "Opérations non soumises à la TVA française",
};

export type VatRegimeCode = "FRANCHISE_EN_BASE" | "REEL_SIMPLIFIE" | "REEL_NORMAL";

export type Classification = { category: EReportingCategory } | { reason: string };

/**
 * Catégorie e-reporting d'une opération avec un particulier.
 *
 * Hypothèse à confirmer : une vente en franchise en base de TVA (art. 293 B du CGI) est rangée en TNT1
 * (« non soumise à la TVA française »), faute de code dédié à la franchise.
 *
 * Une opération mixte ne peut pas être rangée dans une seule catégorie : la facture devrait être
 * ventilée ligne par ligne, ce que l'application ne gère pas (elle refuse donc de l'émettre pour un particulier).
 */
export function classifyB2cOperation(input: {
  operationCategory: OperationCategory;
  vatRegime: VatRegimeCode;
}): Classification {
  if (input.operationCategory === "MIXTE") {
    return { reason: "opération mixte (biens et services) : elle doit être ventilée entre TLB1 et TPS1" };
  }
  if (input.vatRegime === "FRANCHISE_EN_BASE") return { category: "TNT1" };
  return { category: input.operationCategory === "LIVRAISON_BIENS" ? "TLB1" : "TPS1" };
}

export function isFrance(country: string | null | undefined): boolean {
  const normalized = (country ?? "").trim();
  return /^france$/i.test(normalized) || normalized.toUpperCase() === "FR";
}
