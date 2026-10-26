import { describe, expect, it } from "vitest";
import { readGodmodeCandidates } from "./godmode-param";

// Code fictif imitant la forme du vrai secret : +, @ et un % non suivi de deux chiffres hexadécimaux.
const CODE = "ab+cD_ef@gH%-1jK";

describe("readGodmodeCandidates", () => {
  it("retrouve le code quand le lien est collé tel quel (« + » et « % » non protégés)", () => {
    expect(readGodmodeCandidates(`?godmode=${CODE}`)).toContain(CODE);
  });

  it("retrouve le code quand le lien est correctement encodé", () => {
    expect(readGodmodeCandidates(`?godmode=${encodeURIComponent(CODE)}`)).toContain(CODE);
  });

  it("retrouve un code contenant une séquence %XX valide, collé tel quel ou encodé", () => {
    const tricky = "xy%41z+q";
    expect(readGodmodeCandidates(`?godmode=${tricky}`)).toContain(tricky);
    expect(readGodmodeCandidates(`?godmode=${encodeURIComponent(tricky)}`)).toContain(tricky);
  });

  it("ne confond pas le code avec les autres paramètres ni avec l'ancre", () => {
    expect(readGodmodeCandidates(`?onboarding=1&godmode=${CODE}&x=1#haut`)).toContain(CODE);
    expect(readGodmodeCandidates(`?onboarding=1&godmode=abc&x=1#haut`)).toEqual(["abc"]);
  });

  it("ne renvoie aucun candidat sans paramètre ou avec une valeur vide", () => {
    expect(readGodmodeCandidates("")).toEqual([]);
    expect(readGodmodeCandidates("?demo=true")).toEqual([]);
    expect(readGodmodeCandidates("?godmode=")).toEqual([]);
  });

  it("ne confond pas un autre paramètre se terminant par godmode", () => {
    expect(readGodmodeCandidates("?notgodmode=abc")).toEqual([]);
  });
});
