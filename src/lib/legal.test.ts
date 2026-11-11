import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS, PUBLIC_LEGAL_PATHS, TERMS_VERSION } from "./legal";

const root = path.resolve(__dirname, "../..");

describe("documents légaux", () => {
  it("chaque document listé dans le pied de page a sa page, avec un titre", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      const file = path.join(root, "src/app", doc.href, "page.tsx");
      expect(existsSync(file), `${doc.href} : page manquante`).toBe(true);
      expect(readFileSync(file, "utf-8"), `${doc.href} : métadonnées manquantes`).toContain("export const metadata");
    }
  });

  it("toutes les pages légales sont publiques (accessibles sans connexion)", () => {
    expect(PUBLIC_LEGAL_PATHS).toEqual(expect.arrayContaining(["/mentions-legales", "/cgu", "/cgv", "/confidentialite", "/cookies", "/accessibilite"]));
    const middleware = readFileSync(path.join(root, "middleware.ts"), "utf-8");
    expect(middleware).toContain("PUBLIC_LEGAL_PATHS");
  });

  it("la version des conditions est une date ISO", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("aucun outil de suivi tiers n'est présent dans les dépendances", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8")) as { dependencies: Record<string, string> };
    const tracking = /analytics|gtag|gtm|googletagmanager|plausible|posthog|mixpanel|hotjar|sentry|segment|amplitude|fullstory|heap|matomo|pixel|clarity/i;
    expect(Object.keys(pkg.dependencies).filter((d) => tracking.test(d))).toEqual([]);
  });
});
