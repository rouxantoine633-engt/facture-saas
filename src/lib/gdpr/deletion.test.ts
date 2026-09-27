import { describe, expect, it } from "vitest";
import { anonymizedEmailFor, pickDeletionStrategy, redactAuditMetadata } from "./deletion";

describe("pickDeletionStrategy", () => {
  it("efface entièrement un compte qui n'a jamais rien émis", () => {
    expect(pickDeletionStrategy({ emittedInvoices: 0, creditNotes: 0 })).toBe("HARD_DELETE");
  });

  it("anonymise dès qu'une facture émise existe", () => {
    expect(pickDeletionStrategy({ emittedInvoices: 1, creditNotes: 0 })).toBe("ANONYMIZE");
  });

  it("anonymise dès qu'un avoir existe, même sans facture restante", () => {
    expect(pickDeletionStrategy({ emittedInvoices: 0, creditNotes: 1 })).toBe("ANONYMIZE");
  });
});

describe("redactAuditMetadata", () => {
  it("retire une adresse email dans une chaîne", () => {
    expect(redactAuditMetadata("envoyé à jean@example.fr")).toBe("envoyé à [email retiré]");
  });

  it("retire les emails imbriqués dans un objet", () => {
    expect(redactAuditMetadata({ to: "jean@example.fr", number: "F-2026-0001" })).toEqual({
      to: "[email retiré]",
      number: "F-2026-0001",
    });
  });

  it("traverse les tableaux", () => {
    expect(redactAuditMetadata(["a@b.fr", { x: "c@d.fr" }])).toEqual(["[email retiré]", { x: "[email retiré]" }]);
  });

  it("laisse passer les valeurs sans email et les valeurs vides", () => {
    expect(redactAuditMetadata({ number: "F-1", amount: 100 })).toEqual({ number: "F-1", amount: 100 });
    expect(redactAuditMetadata(null)).toBeNull();
    expect(redactAuditMetadata(undefined)).toBeUndefined();
  });
});

describe("anonymizedEmailFor", () => {
  it("produit une adresse déterministe et unique par utilisateur", () => {
    expect(anonymizedEmailFor("abc123")).toBe("compte-supprime+abc123@deleted.invalid");
    expect(anonymizedEmailFor("abc123")).not.toBe(anonymizedEmailFor("xyz789"));
  });
});
