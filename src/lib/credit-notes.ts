import type { InvoiceStatus } from "@prisma/client";

export interface CreditNoteCheckInput {
  reason: string;
  lineCount: number;
  newTotalTtcCents: number;
  invoiceTotalTtcCents: number;
  alreadyCreditedTtcCents: number;
}

/** Retourne les problèmes bloquant l'émission de l'avoir, en français clair. Vide = valide. */
export function validateCreditNote(input: CreditNoteCheckInput): string[] {
  const errors: string[] = [];
  if (input.reason.trim().length < 3) errors.push("Indiquez le motif de l'avoir (ex : erreur de prix, prestation annulée).");
  if (input.lineCount === 0) errors.push("Ajoutez au moins une ligne à l'avoir.");
  if (input.newTotalTtcCents <= 0) errors.push("Le montant de l'avoir doit être supérieur à 0.");

  const remaining = input.invoiceTotalTtcCents - input.alreadyCreditedTtcCents;
  if (input.newTotalTtcCents > remaining) {
    errors.push(
      remaining <= 0
        ? "Cette facture a déjà été entièrement annulée par des avoirs."
        : "Le montant de l'avoir dépasse ce qu'il reste à créditer sur cette facture."
    );
  }
  return errors;
}

/**
 * Statut de la facture après création d'un avoir :
 * - entièrement créditée : annulée par avoir ;
 * - sinon, si paiements + avoirs couvrent le total : payée ;
 * - sinon inchangé.
 */
export function statusAfterCreditNote(params: {
  current: InvoiceStatus;
  totalTtcCents: number;
  creditedTtcCents: number;
  paidCents: number;
}): InvoiceStatus {
  const { current, totalTtcCents, creditedTtcCents, paidCents } = params;
  if (current === "DRAFT" || current === "CANCELLED_BY_CREDIT_NOTE") return current;
  if (creditedTtcCents >= totalTtcCents) return "CANCELLED_BY_CREDIT_NOTE";
  if (current !== "PAID" && paidCents + creditedTtcCents >= totalTtcCents) return "PAID";
  return current;
}

/** Reste à payer sur une facture après paiements et avoirs (jamais négatif). */
export function amountStillDue(params: { totalTtcCents: number; paidCents: number; creditedTtcCents: number }): number {
  return Math.max(0, params.totalTtcCents - params.paidCents - params.creditedTtcCents);
}
