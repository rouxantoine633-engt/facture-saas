import { describe, expect, it } from "vitest";
import { amountStillDue, statusAfterCreditNote, validateCreditNote } from "./credit-notes";

const ok = { reason: "Erreur de prix", lineCount: 1, newTotalTtcCents: 5000, invoiceTotalTtcCents: 12000, alreadyCreditedTtcCents: 0 };

describe("validateCreditNote", () => {
  it("accepte un avoir partiel valide", () => {
    expect(validateCreditNote(ok)).toEqual([]);
  });

  it("accepte un avoir égal au solde créditable", () => {
    expect(validateCreditNote({ ...ok, newTotalTtcCents: 12000 })).toEqual([]);
    expect(validateCreditNote({ ...ok, alreadyCreditedTtcCents: 7000 })).toEqual([]);
  });

  it("refuse un avoir supérieur au solde créditable", () => {
    expect(validateCreditNote({ ...ok, newTotalTtcCents: 12001 })).toHaveLength(1);
    expect(validateCreditNote({ ...ok, alreadyCreditedTtcCents: 8000 })).toHaveLength(1);
  });

  it("signale une facture déjà entièrement annulée", () => {
    const errors = validateCreditNote({ ...ok, alreadyCreditedTtcCents: 12000 });
    expect(errors.join(" ")).toContain("entièrement annulée");
  });

  it("exige un motif, une ligne et un montant positif", () => {
    expect(validateCreditNote({ ...ok, reason: " " })).toHaveLength(1);
    expect(validateCreditNote({ ...ok, lineCount: 0, newTotalTtcCents: 0 })).toHaveLength(2);
  });
});

describe("statusAfterCreditNote", () => {
  const base = { totalTtcCents: 12000, paidCents: 0 };

  it("annule la facture quand elle est entièrement créditée", () => {
    expect(statusAfterCreditNote({ ...base, current: "OVERDUE", creditedTtcCents: 12000 })).toBe("CANCELLED_BY_CREDIT_NOTE");
    expect(statusAfterCreditNote({ ...base, current: "PAID", paidCents: 12000, creditedTtcCents: 12000 })).toBe("CANCELLED_BY_CREDIT_NOTE");
  });

  it("conserve le statut sur un avoir partiel", () => {
    expect(statusAfterCreditNote({ ...base, current: "OVERDUE", creditedTtcCents: 5000 })).toBe("OVERDUE");
  });

  it("passe en payée quand paiements + avoirs couvrent le total", () => {
    expect(statusAfterCreditNote({ ...base, current: "PARTIALLY_PAID", paidCents: 7000, creditedTtcCents: 5000 })).toBe("PAID");
  });

  it("ne touche jamais un brouillon", () => {
    expect(statusAfterCreditNote({ ...base, current: "DRAFT", creditedTtcCents: 12000 })).toBe("DRAFT");
  });
});

describe("amountStillDue", () => {
  it("déduit paiements et avoirs", () => {
    expect(amountStillDue({ totalTtcCents: 12000, paidCents: 2000, creditedTtcCents: 5000 })).toBe(5000);
  });
  it("ne descend jamais sous zéro", () => {
    expect(amountStillDue({ totalTtcCents: 12000, paidCents: 12000, creditedTtcCents: 12000 })).toBe(0);
  });
});
