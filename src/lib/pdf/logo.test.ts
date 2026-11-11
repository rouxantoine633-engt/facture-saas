import { describe, expect, it } from "vitest";
import { DOCUMENT_LOGO_BOX, fitLogo, REPORT_LOGO_BOX } from "./logo";

describe("fitLogo", () => {
  it("réduit un grand logo pour tenir dans l'emplacement, sans le déformer", () => {
    const size = fitLogo({ width: 1200, height: 600 }, DOCUMENT_LOGO_BOX); // 2:1 dans 150×56
    expect(size).toEqual({ width: 112, height: 56 });
    expect(size.width / size.height).toBeCloseTo(2, 1);
  });

  it("ne dépasse jamais l'emplacement, quelle que soit la forme du logo", () => {
    for (const [width, height] of [[4000, 100], [100, 4000], [300, 300], [1, 1], [150, 56], [149, 57], [3999, 3999]] as const) {
      for (const box of [DOCUMENT_LOGO_BOX, REPORT_LOGO_BOX]) {
        const s = fitLogo({ width, height }, box);
        expect(s.width, `${width}×${height}`).toBeLessThanOrEqual(box.width);
        expect(s.height, `${width}×${height}`).toBeLessThanOrEqual(box.height);
        expect(s.width).toBeGreaterThanOrEqual(1);
        expect(s.height).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("conserve les proportions d'un logo très large (bandeau) et d'un logo très haut", () => {
    const banner = fitLogo({ width: 3000, height: 150 }, DOCUMENT_LOGO_BOX);
    expect(banner.width).toBe(150);
    expect(banner.height).toBe(8);
    const tall = fitLogo({ width: 100, height: 1000 }, DOCUMENT_LOGO_BOX);
    expect(tall.height).toBe(56);
    expect(tall.width).toBe(6);
  });

  it("n'agrandit pas un petit logo au-delà de sa taille d'origine (il serait flou)", () => {
    expect(fitLogo({ width: 60, height: 30 }, DOCUMENT_LOGO_BOX)).toEqual({ width: 60, height: 30 });
  });
});
