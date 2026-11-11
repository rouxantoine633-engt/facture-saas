import { describe, expect, it } from "vitest";
import { registerSchema } from "./auth";

const base = { name: "Jean", email: "jean@example.fr", password: "un-mot-de-passe-long" };

describe("registerSchema", () => {
  it("accepte une inscription dont les CGU/CGV sont cochées", () => {
    expect(registerSchema.safeParse({ ...base, acceptTerms: "on" }).success).toBe(true);
  });

  it("refuse l'inscription sans acceptation, avec un message clair rattaché au bon champ", () => {
    for (const acceptTerms of [null, undefined, "", "off", "true"]) {
      const result = registerSchema.safeParse({ ...base, acceptTerms });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path[0]).toBe("acceptTerms");
        expect(result.error.issues[0]?.message).toContain("CGU");
      }
    }
  });

  it("signale d'abord les autres erreurs (nom, email, mot de passe) avant l'acceptation", () => {
    const result = registerSchema.safeParse({ ...base, password: "court", acceptTerms: null });
    expect(!result.success && result.error.issues[0]?.path[0]).toBe("password");
  });
});
