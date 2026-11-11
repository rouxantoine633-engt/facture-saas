import { decodePDFRawStream, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { computeLineTotals } from "@/lib/money";
import type { SalesDocument } from "@/lib/export/accounting";
import { buildPaymentsReport, buildSalesReport } from "@/lib/export/report";
import { inspectLogo } from "@/lib/logo";
import { periodLabel } from "./ExportReportPdf";
import { renderExportReportBuffer } from "./render";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAAPklEQVR4nM3OQQEAEADAwFkQWTRWQywRPO0S3JhrH8IkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuL8HXi5DuUB/eSvaYAAAAAASUVORK5CYII=";
const png = Buffer.from(PNG, "base64");
const checked = inspectLogo(png);
if (!checked.ok) throw new Error(checked.error);
const logo = { data: png, format: checked.format, width: checked.width, height: checked.height };

const period = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-11-30T23:59:59Z") };
const base = { period, generatedAt: new Date("2026-11-11T09:00:00Z") };
const company = (extra = {}) => ({ legalName: "Entreprise Démo & Associés", brandColor: "#1e40af", footerLines: ["Entreprise Démo — SIRET 55210055400013", "TVA non applicable, art. 293B du CGI"], ...extra });

const sales: SalesDocument[] = [
  { kind: "INVOICE", number: "F-1", issueDate: new Date("2026-03-03T10:00:00Z"), clientName: "Client", lines: [{ vatRatePer100000: 20000, ...computeLineTotals({ quantity: "1", unitPriceCents: 10000, vatRatePer100000: 20000 }) }], statusLabel: "Envoyée" },
];

async function xmp(pdf: Buffer): Promise<string> {
  const doc = await PDFDocument.load(pdf);
  const stream = doc.context.lookup(doc.catalog.get(PDFName.of("Metadata"))) as PDFRawStream;
  return Buffer.from(decodePDFRawStream(stream).decode()).toString("utf-8");
}

function imageCount(pdf: PDFDocument): number {
  return pdf.context.enumerateIndirectObjects().filter(([, o]) => String((o as { dict?: unknown }).dict ?? "").includes("/Subtype /Image")).length;
}

describe("rapport PDF des exports comptables", () => {
  it("produit un PDF/A-3b titré avec la période, sans XML embarqué", async () => {
    const buf = await renderExportReportBuffer({ kind: "SALES", company: company(), ...base, report: buildSalesReport(sales) });
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    const meta = await xmp(buf);
    expect(meta).toContain("Journal des ventes du 01/01/2026 au 30/11/2026");
    expect(meta).toContain("Entreprise Démo &amp; Associés");
    expect(meta).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(meta).not.toContain("factur-x.xml");
  });

  it("embarque le logo quand il y en a un, et seulement alors", async () => {
    const without = await renderExportReportBuffer({ kind: "SALES", company: company(), ...base, report: buildSalesReport(sales) });
    const withLogo = await renderExportReportBuffer({ kind: "SALES", company: company({ logo }), ...base, report: buildSalesReport(sales) });
    expect(imageCount(await PDFDocument.load(without))).toBe(0);
    expect(imageCount(await PDFDocument.load(withLogo))).toBeGreaterThan(0);
  });

  it("gère les encaissements et la période sans écriture", async () => {
    const payments = await renderExportReportBuffer({
      kind: "PAYMENTS",
      company: company(),
      ...base,
      report: buildPaymentsReport([{ paidAt: new Date("2026-03-05T10:00:00Z"), invoiceNumber: "F-1", clientName: "C", amountCents: 1000, methodLabel: "Virement" }]),
    });
    expect(await xmp(payments)).toContain("Encaissements du 01/01/2026");
    const empty = await renderExportReportBuffer({ kind: "SALES", company: company(), ...base, report: buildSalesReport([]) });
    expect((await PDFDocument.load(empty)).getPageCount()).toBe(1);
  });

  it("libelle la période", () => {
    expect(periodLabel(period)).toBe("du 01/01/2026 au 30/11/2026");
  });
});
