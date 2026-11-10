/**
 * Catégorie d'opération d'une facture (mention obligatoire avec la réforme de
 * la facturation électronique) : livraison de biens, prestation de services
 * ou opération mixte.
 */
export const OPERATION_CATEGORIES = ["LIVRAISON_BIENS", "PRESTATION_SERVICES", "MIXTE"] as const;

export type OperationCategory = (typeof OPERATION_CATEGORIES)[number];

export const DEFAULT_OPERATION_CATEGORY: OperationCategory = "PRESTATION_SERVICES";

export const OPERATION_CATEGORY_LABELS: Record<OperationCategory, string> = {
  LIVRAISON_BIENS: "Livraison de biens",
  PRESTATION_SERVICES: "Prestation de services",
  MIXTE: "Opération mixte (biens et services)",
};

/**
 * Code du cadre de facturation (BT-23) dans le format Factur-X / CII. Le
 * chiffre « 1 » désigne une facture ordinaire (ni déjà payée, ni définitive
 * après acompte), seul cas géré par Onyx.
 */
export const BILLING_FRAMEWORK_CODES: Record<OperationCategory, "B1" | "S1" | "M1"> = {
  LIVRAISON_BIENS: "B1",
  PRESTATION_SERVICES: "S1",
  MIXTE: "M1",
};

export function isOperationCategory(value: unknown): value is OperationCategory {
  return typeof value === "string" && (OPERATION_CATEGORIES as readonly string[]).includes(value);
}
