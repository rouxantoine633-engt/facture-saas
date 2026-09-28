import type { QuoteStatus } from "@prisma/client";

/**
 * Statuts qu'un utilisateur peut choisir manuellement. `DRAFT` s'obtient
 * uniquement à la création, `CONVERTED` uniquement via la conversion en
 * facture — aucun des deux n'est un choix manuel.
 */
export const MANUAL_QUOTE_STATUSES: QuoteStatus[] = ["SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

/** Un devis converti en facture est verrouillé : son statut ne peut plus changer. */
export function canSetQuoteStatus(current: QuoteStatus, next: QuoteStatus): boolean {
  if (current === "CONVERTED") return false;
  return MANUAL_QUOTE_STATUSES.includes(next);
}
