import { describe, expect, it } from "vitest";
import { accentForText, contrastRatio, DEFAULT_BRAND_COLOR, normalizeHexColor, readableTextOn, tint } from "./colors";

describe("normalizeHexColor", () => {
  it("normalise les couleurs valides et refuse le reste", () => {
    expect(normalizeHexColor("#1E40AF")).toBe("#1e40af");
    expect(normalizeHexColor(" #abc ")).toBe("#aabbcc");
    for (const bad of ["", "1e40af", "#12345", "#gggggg", "red", null, undefined]) expect(normalizeHexColor(bad as never)).toBeNull();
  });
});

describe("contraste", () => {
  it("calcule des rapports de contraste de référence", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("choisit un texte lisible sur n'importe quel fond", () => {
    expect(readableTextOn("#1e40af")).toBe("#ffffff");
    expect(readableTextOn("#fde047")).toBe("#000000"); // jaune : texte sombre
    expect(readableTextOn("#000000")).toBe("#ffffff");
    for (const bg of ["#ff0000", "#00ff00", "#0000ff", "#808080", "#ffff00", "#ff00ff", "#00ffff", DEFAULT_BRAND_COLOR]) {
      expect(contrastRatio(readableTextOn(bg), bg), bg).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("assombrit une couleur trop claire pour qu'elle reste lisible en texte sur fond blanc", () => {
    for (const c of ["#fde047", "#ffff00", "#a5f3fc", "#ffffff", "#1e40af"]) {
      expect(contrastRatio(accentForText(c), "#ffffff"), c).toBeGreaterThanOrEqual(4.5);
    }
    expect(accentForText("#1e40af")).toBe("#1e40af"); // déjà assez foncée : inchangée
  });

  it("produit un fond très clair à partir de la couleur", () => {
    expect(contrastRatio(tint("#1e40af"), "#ffffff")).toBeLessThan(1.4);
  });
});
