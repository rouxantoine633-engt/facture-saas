import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("pied de page des PDF", () => {
  const source = readFileSync(path.resolve(__dirname, "DocumentPdf.tsx"), "utf-8");
  const footerStyles = source.slice(source.indexOf("footer: {"), source.indexOf("// Pas de `lineHeight`"));

  it("n'utilise pas `lineHeight` sur le bloc en position absolue", () => {
    // Piège react-pdf constaté avec PDFium (Chrome) : un `lineHeight` sur un bloc `absolute` + `fixed` envoie le
    // pied de page hors de la page (y > 3000 pt), de sorte qu'il disparaît des lecteurs PDF sans aucune erreur.
    expect(footerStyles).toContain("position: \"absolute\"");
    expect(footerStyles).not.toContain("lineHeight");
  });

  it("réserve sous le contenu la place des mentions légales (jusqu'à 4 lignes)", () => {
    expect(source).toMatch(/paddingBottom: (9\d|1\d\d)/);
  });
});
