import { describe, expect, it } from "vitest";
import { canSetQuoteStatus, MANUAL_QUOTE_STATUSES } from "./quote-status";

describe("canSetQuoteStatus", () => {
  it("autorise les statuts manuels depuis un devis brouillon", () => {
    for (const s of MANUAL_QUOTE_STATUSES) {
      expect(canSetQuoteStatus("DRAFT", s)).toBe(true);
    }
  });

  it("autorise à changer d'avis entre les statuts manuels", () => {
    expect(canSetQuoteStatus("SENT", "ACCEPTED")).toBe(true);
    expect(canSetQuoteStatus("ACCEPTED", "REJECTED")).toBe(true);
    expect(canSetQuoteStatus("EXPIRED", "SENT")).toBe(true);
  });

  it("verrouille un devis converti en facture, quel que soit le statut visé", () => {
    for (const s of MANUAL_QUOTE_STATUSES) {
      expect(canSetQuoteStatus("CONVERTED", s)).toBe(false);
    }
    expect(canSetQuoteStatus("CONVERTED", "DRAFT")).toBe(false);
  });

  it("refuse de repasser manuellement en brouillon ou de se fixer soi-même comme converti", () => {
    expect(canSetQuoteStatus("SENT", "DRAFT")).toBe(false);
    expect(canSetQuoteStatus("SENT", "CONVERTED")).toBe(false);
  });
});
