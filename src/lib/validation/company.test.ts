import { describe, expect, it } from "vitest";
import { companySchema, normalizeNafCode } from "./company";

const base = {
  legalName: "Jean Dupont",
  legalForm: "AUTO_ENTREPRENEUR",
  siren: "552100554",
  siret: "55210055400013",
  vatRegime: "FRANCHISE_EN_BASE",
  addressLine1: "1 rue de la Paix",
  postalCode: "75002",
  city: "Paris",
  email: "jean@example.fr",
  defaultPaymentTermsDays: 30,
};

describe("code NAF/APE", () => {
  it("normalise la saisie (point, espaces, minuscules)", () => {
    expect(normalizeNafCode("62.01z")).toBe("6201Z");
    expect(normalizeNafCode(" 6201 Z ")).toBe("6201Z");
  });

  it("accepte un code valide ou vide, et le normalise", () => {
    expect(companySchema.parse({ ...base, nafCode: "62.01z" }).nafCode).toBe("6201Z");
    expect(companySchema.parse({ ...base, nafCode: "" }).nafCode).toBe("");
    expect(companySchema.parse(base).nafCode).toBeUndefined();
  });

  it("refuse un code mal formé", () => {
    for (const nafCode of ["620", "62011", "ABCDE", "6201ZZ"]) {
      const r = companySchema.safeParse({ ...base, nafCode });
      expect(r.success, nafCode).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toContain("NAF");
    }
  });
});

describe("immatriculation facultative (RCS / Répertoire des métiers)", () => {
  it("accepte un artisan avec chambre de métiers et numéro", () => {
    expect(companySchema.safeParse({ ...base, rmCity: "Clermont-Ferrand", rmNumber: "552 100 554" }).success).toBe(true);
  });

  it("refuse un numéro sans sa ville, et inversement", () => {
    expect(companySchema.safeParse({ ...base, rmNumber: "552 100 554" }).success).toBe(false);
    expect(companySchema.safeParse({ ...base, rmCity: "Lyon" }).success).toBe(false);
    expect(companySchema.safeParse({ ...base, rcsNumber: "552 100 554" }).success).toBe(false);
    expect(companySchema.safeParse({ ...base, rcsCity: "Lyon", rcsNumber: "552 100 554" }).success).toBe(true);
  });

  it("exige toujours le RCS et le capital d'une société", () => {
    expect(companySchema.safeParse({ ...base, legalForm: "SARL" }).success).toBe(false);
  });
});
