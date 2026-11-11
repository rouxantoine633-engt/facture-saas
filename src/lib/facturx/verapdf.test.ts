import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PDFDocument } from "pdf-lib";
import { afterAll, describe, expect, it } from "vitest";
import { computeLineTotals, summarizeDocument } from "@/lib/money";
import {
  buildCreditNotePdfData,
  buildInvoicePdfData,
  buildQuotePdfData,
  type InvoicePdfInput,
} from "@/lib/pdf/build-data";
import { renderExportReportBuffer, renderPdfBuffer } from "@/lib/pdf/render";
import { buildPaymentsReport, buildSalesReport } from "@/lib/export/report";
import { legalFooterLines } from "@/lib/pdf/build-data";
import { inspectLogo } from "@/lib/logo";
import type { FacturXInput } from "./cii";

/**
 * Validation PDF/A-3b par veraPDF (référence open source du PDF/A).
 *
 * Ce test a besoin de Java et de veraPDF, absents de la plupart des environnements : il est
 * alors ignoré (pas d'échec). Pour l'activer, installez veraPDF puis :
 *   - soit renseignez VERAPDF_BIN (chemin du script `verapdf`),
 *   - soit mettez `verapdf` dans le PATH,
 *   - soit installez-le dans ~/.local/share/verapdf-tools/verapdf (emplacement détecté seul).
 * Un JRE embarqué à côté (~/.local/share/verapdf-tools/jdk-*-jre) est utilisé s'il n'y a pas de Java système.
 */

const toolsDir = path.join(homedir(), ".local", "share", "verapdf-tools");

function findJavaHome(): string | undefined {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  const bundled = existsSync(toolsDir) ? readdirSync(toolsDir).find((n) => /^jdk-.*-jre$/.test(n)) : undefined;
  return bundled ? path.join(toolsDir, bundled, "Contents", "Home") : undefined;
}

function findVeraPdf(): { bin: string; env: NodeJS.ProcessEnv } | undefined {
  const javaHome = findJavaHome();
  const env: NodeJS.ProcessEnv = { ...process.env, ...(javaHome ? { JAVA_HOME: javaHome } : {}) };
  const candidates = [process.env.VERAPDF_BIN, path.join(toolsDir, "verapdf", "verapdf"), "verapdf"].filter(
    (c): c is string => Boolean(c)
  );
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["--version"], { env, stdio: "ignore", timeout: 30_000 });
      return { bin, env };
    } catch {
      // candidat suivant
    }
  }
  return undefined;
}

const vera = findVeraPdf();
if (!vera) console.info("[verapdf.test] veraPDF introuvable : tests de conformité PDF/A-3b ignorés (voir l'en-tête du fichier).");
const run = promisify(execFile);
const workDir = vera ? mkdtempSync(path.join(tmpdir(), "verapdf-")) : undefined;

afterAll(async () => {
  if (workDir) await rm(workDir, { recursive: true, force: true });
});

/** Valide un PDF en PDF/A-3b ; renvoie le verdict et, en cas d'échec, le détail des règles violées. */
async function validate(name: string, pdf: Uint8Array): Promise<{ compliant: boolean; report: string }> {
  const file = path.join(workDir!, `${name}.pdf`);
  await writeFile(file, pdf);
  try {
    const { stdout } = await run(vera!.bin, ["--flavour", "3b", "--format", "text", "--verbose", file], {
      env: vera!.env,
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    return { compliant: stdout.startsWith("PASS"), report: stdout };
  } catch (e) {
    // veraPDF sort en code ≠ 0 quand le document n'est pas conforme : le verdict est dans stdout.
    const out = (e as { stdout?: string }).stdout ?? String(e);
    return { compliant: false, report: out };
  }
}

const seller: InvoicePdfInput["seller"] = {
  legalName: "Entreprise Démo & Associés",
  legalForm: "SARL",
  siren: "552100554",
  siret: "55210055400013",
  vatRegime: "REEL_SIMPLIFIE",
  vatNumber: "FR40552100554",
  addressLine1: "12 rue de la Démo",
  postalCode: "75001",
  city: "Paris",
  country: "France",
  email: "contact@demo.example",
  iban: "FR7630006000011234567890189",
  bic: "AGRIFRPP",
};

const franchiseSeller: InvoicePdfInput["seller"] = {
  ...seller,
  legalName: "Jean Dupont",
  legalForm: "AUTO_ENTREPRENEUR",
  vatRegime: "FRANCHISE_EN_BASE",
  vatNumber: undefined,
};

const business: InvoicePdfInput["buyer"] = {
  type: "BUSINESS",
  name: "Atelier Bois & Fer SAS",
  addressLine1: "27 quai des Forges",
  postalCode: "69002",
  city: "Lyon",
  country: "France",
  siret: "44455566600027",
  vatNumber: "FR44455566600",
};

const individual: InvoicePdfInput["buyer"] = {
  type: "INDIVIDUAL",
  name: "Claire Martin",
  addressLine1: "3 rue des Lilas",
  postalCode: "33000",
  city: "Bordeaux",
  country: "France",
};

function line(description: string, quantity: string, unitPriceCents: number, vatRatePer100000: number) {
  return {
    description,
    quantity,
    unitPriceCents,
    vatRatePer100000,
    ...computeLineTotals({ quantity, unitPriceCents, vatRatePer100000 }),
  };
}

const settlement = { latePenaltyText: "Taux BCE + 10 points", recoveryIndemnityCents: 4000, discountText: "Escompte non applicable" };

function invoiceInput(s: InvoicePdfInput["seller"], buyer: InvoicePdfInput["buyer"], lines: ReturnType<typeof line>[]): InvoicePdfInput {
  return {
    number: "F-2026-0001",
    isDraft: false,
    issueDate: new Date("2026-11-10T09:30:00Z"),
    dueDate: new Date("2026-12-10T00:00:00Z"),
    operationCategory: "PRESTATION_SERVICES",
    lines,
    seller: s,
    buyer,
    latePenaltyRateText: settlement.latePenaltyText,
    recoveryIndemnityCents: settlement.recoveryIndemnityCents,
    discountPolicyText: settlement.discountText,
  };
}

function facturxOf(kind: "INVOICE" | "CREDIT_NOTE", base: InvoicePdfInput, data: { lines: FacturXInput["lines"]; totals: FacturXInput["totals"] }): FacturXInput {
  return {
    kind,
    number: kind === "INVOICE" ? base.number : "AV-2026-0001",
    issueDate: base.issueDate,
    dueDate: kind === "INVOICE" ? base.dueDate : undefined,
    operationCategory: base.operationCategory,
    seller: base.seller,
    buyer: base.buyer,
    lines: data.lines,
    totals: data.totals,
    settlement,
    rectifiedInvoice: kind === "CREDIT_NOTE" ? { number: base.number, issueDate: base.issueDate } : undefined,
  };
}

describe.skipIf(!vera)("conformité PDF/A-3b (veraPDF)", () => {
  const multiRate = [line("Conception du site", "3", 45000, 20000), line("Hébergement annuel", "1", 24000, 5500)];

  it("facture Factur-X, TVA multi-taux, client professionnel", async () => {
    const input = invoiceInput(seller, business, multiRate);
    const data = buildInvoicePdfData(input);
    const pdf = await renderPdfBuffer(data, facturxOf("INVOICE", input, data));
    const { compliant, report } = await validate("facture-facturx", pdf);
    expect(compliant, report).toBe(true);
  }, 120_000);

  it("facture Factur-X en franchise en base de TVA", async () => {
    const input = invoiceInput(franchiseSeller, business, [line("Prestation de conseil", "2", 50000, 0)]);
    const data = buildInvoicePdfData(input);
    const pdf = await renderPdfBuffer(data, facturxOf("INVOICE", input, data));
    const { compliant, report } = await validate("facture-franchise", pdf);
    expect(compliant, report).toBe(true);
  }, 120_000);

  it("avoir Factur-X", async () => {
    const input = invoiceInput(seller, business, multiRate);
    const data = buildCreditNotePdfData({
      number: "AV-2026-0001",
      issueDate: input.issueDate,
      invoiceNumber: input.number,
      invoiceDate: input.issueDate,
      operationCategory: input.operationCategory,
      reason: "Erreur de prix sur la ligne d'hébergement",
      lines: [line("Hébergement annuel", "1", 24000, 5500)],
      seller,
      buyer: business,
    });
    const pdf = await renderPdfBuffer(data, facturxOf("CREDIT_NOTE", input, data));
    const { compliant, report } = await validate("avoir-facturx", pdf);
    expect(compliant, report).toBe(true);
  }, 120_000);

  it("PDF simple (facture à un particulier, sans XML embarqué)", async () => {
    const data = buildInvoicePdfData(invoiceInput(franchiseSeller, individual, [line("Cours particulier", "4", 3000, 0)]));
    const { compliant, report } = await validate("facture-particulier", await renderPdfBuffer(data));
    expect(compliant, report).toBe(true);
  }, 120_000);

  it("devis (PDF simple)", async () => {
    const data = buildQuotePdfData({
      number: "DEV-2026-0001",
      issueDate: new Date("2026-11-10T09:30:00Z"),
      validUntil: new Date("2026-12-10T00:00:00Z"),
      lines: multiRate,
      seller,
      buyer: business,
      notes: "Acompte de 30 % à la commande.",
    });
    const { compliant, report } = await validate("devis", await renderPdfBuffer(data));
    expect(compliant, report).toBe(true);
  }, 120_000);

  describe("rapports PDF des exports comptables", () => {
    const PNG = "iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAAPklEQVR4nM3OQQEAEADAwFkQWTRWQywRPO0S3JhrH8IkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuL8HXi5DuUB/eSvaYAAAAAASUVORK5CYII=";
    const logoOf = (b64: string) => {
      const data = Buffer.from(b64, "base64");
      const c = inspectLogo(data);
      if (!c.ok) throw new Error(c.error);
      return { data, format: c.format, width: c.width, height: c.height };
    };
    const company = (brandColor: string, withLogo: boolean) => ({
      legalName: "Entreprise Démo & Associés",
      brandColor,
      logo: withLogo ? logoOf(PNG) : undefined,
      footerLines: legalFooterLines({ ...franchiseSeller, nafCode: "6201Z" }),
    });
    const period = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-11-30T23:59:59Z") };
    const generatedAt = new Date("2026-11-11T09:00:00Z");
    const doc = (n: number, d: string, kind: "INVOICE" | "CREDIT_NOTE" = "INVOICE") => ({
      kind,
      number: `F-${n}`,
      issueDate: new Date(`${d}T10:00:00Z`),
      clientName: "Atelier Bois & Fer SAS",
      lines: multiRate,
      statusLabel: "Envoyée",
    });

    it("journal des ventes avec logo (PNG transparent) et couleur personnalisée", async () => {
      const report = buildSalesReport([doc(1, "2026-03-03"), doc(2, "2026-04-10"), doc(3, "2026-04-11", "CREDIT_NOTE")]);
      const pdf = await renderExportReportBuffer({ kind: "SALES", company: company("#dc2626", true), period, generatedAt, report });
      const { compliant, report: verdict } = await validate("rapport-ventes-logo", pdf);
      expect(compliant, verdict).toBe(true);
    }, 120_000);

    it("encaissements avec une couleur claire et sans logo", async () => {
      const report = buildPaymentsReport([
        { paidAt: new Date("2026-03-05T10:00:00Z"), invoiceNumber: "F-1", clientName: "Claire Martin", amountCents: 12000, methodLabel: "Virement", reference: "VIR-1" },
      ]);
      const pdf = await renderExportReportBuffer({ kind: "PAYMENTS", company: company("#fde047", false), period, generatedAt, report });
      const { compliant, report: verdict } = await validate("rapport-paiements", pdf);
      expect(compliant, verdict).toBe(true);
    }, 120_000);

    it("rapport d'une période vide", async () => {
      const pdf = await renderExportReportBuffer({ kind: "SALES", company: company("#1e40af", true), period, generatedAt, report: buildSalesReport([]) });
      const { compliant, report: verdict } = await validate("rapport-vide", pdf);
      expect(compliant, verdict).toBe(true);
    }, 120_000);
  });

  it("contrôle négatif : un PDF ordinaire, sans métadonnées PDF/A, est bien refusé", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const { compliant } = await validate("temoin-non-conforme", await doc.save());
    expect(compliant).toBe(false);
  }, 120_000);
});
