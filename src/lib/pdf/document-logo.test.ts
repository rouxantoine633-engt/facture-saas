import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { computeLineTotals } from "@/lib/money";
import { buildCreditNotePdfData, buildInvoicePdfData, buildQuotePdfData } from "./build-data";
import { inspectLogo } from "@/lib/logo";
import { renderPdfBuffer } from "./render";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAAPklEQVR4nM3OQQEAEADAwFkQWTRWQywRPO0S3JhrH8IkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuL8HXi5DuUB/eSvaYAAAAAASUVORK5CYII=";
const data = Buffer.from(PNG, "base64");
const c = inspectLogo(data);
if (!c.ok) throw new Error(c.error);
const logo = { data, format: c.format, width: c.width, height: c.height };

const line = { description: "Prestation", quantity: "1", unitPriceCents: 10000, vatRatePer100000: 0, ...computeLineTotals({ quantity: "1", unitPriceCents: 10000, vatRatePer100000: 0 }) };
const seller = { legalName: "Jean Dupont", legalForm: "AUTO_ENTREPRENEUR", siren: "552100554", siret: "55210055400013", vatRegime: "FRANCHISE_EN_BASE" as const, addressLine1: "1 rue de la Paix", postalCode: "75002", city: "Paris", country: "France", email: "jean@example.fr" };
const buyer = { type: "BUSINESS" as const, name: "ACME SAS", addressLine1: "2 avenue Foch", postalCode: "69001", city: "Lyon", country: "France", siret: "44455566600027" };

const invoice = () =>
  buildInvoicePdfData({ number: "F-1", isDraft: false, issueDate: new Date("2026-01-10"), dueDate: new Date("2026-02-09"), operationCategory: "PRESTATION_SERVICES", lines: [line], seller, buyer, latePenaltyRateText: "BCE", recoveryIndemnityCents: 4000, discountPolicyText: "Escompte non applicable" });
const quote = () => buildQuotePdfData({ number: "DEV-1", issueDate: new Date("2026-01-10"), lines: [line], seller, buyer });
const credit = () => buildCreditNotePdfData({ number: "AV-1", issueDate: new Date("2026-01-10"), invoiceNumber: "F-1", invoiceDate: new Date("2026-01-01"), operationCategory: "PRESTATION_SERVICES", reason: "Erreur", lines: [line], seller, buyer });

async function images(pdf: Buffer): Promise<number> {
  const doc = await PDFDocument.load(pdf);
  return doc.context.enumerateIndirectObjects().filter(([, o]) => String((o as { dict?: unknown }).dict ?? "").includes("/Subtype /Image")).length;
}

describe("logo sur les devis, factures et avoirs", () => {
  for (const [name, build] of [["facture", invoice], ["devis", quote], ["avoir", credit]] as const) {
    it(`${name} : le logo est embarqué quand il existe, et seulement alors`, async () => {
      expect(await images(await renderPdfBuffer(build()))).toBe(0);
      expect(await images(await renderPdfBuffer({ ...build(), logo }))).toBeGreaterThan(0);
    });
  }

  it("un brouillon porte aussi le logo", async () => {
    const draft = { ...invoice(), isDraft: true, logo };
    expect(await images(await renderPdfBuffer(draft))).toBeGreaterThan(0);
  });
});
