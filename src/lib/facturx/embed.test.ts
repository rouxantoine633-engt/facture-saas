import { decodePDFRawStream, PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { finalizePdf } from "./embed";

async function samplePdf(title = "FACTURE N° F-2026-0001"): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage();
  doc.setTitle(title);
  doc.setAuthor("Entreprise Démo & Associés");
  doc.setSubject("Facture — Atelier Bois & Fer");
  doc.setCreationDate(new Date("2026-11-10T09:30:00Z"));
  return doc.save();
}

async function xmpOf(pdf: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(pdf);
  const stream = doc.context.lookup(doc.catalog.get(PDFName.of("Metadata"))) as PDFRawStream;
  return Buffer.from(decodePDFRawStream(stream).decode()).toString("utf-8");
}

describe("finalizePdf", () => {
  it("réécrit le XMP en XML bien formé, même avec des « & » dans les métadonnées", async () => {
    const xmp = await xmpOf(await finalizePdf(await samplePdf()));
    expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
    expect(xmp).toContain("Entreprise Démo &amp; Associés");
    expect(xmp).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
    expect(xmp).not.toContain("factur-x.xml");
    expect(xmp).not.toContain("<fx:");
  });

  it("embarque le XML Factur-X, le déclare dans /AF et /Names, et le décrit dans le XMP", async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rsm:CrossIndustryInvoice>é &amp; test</rsm:CrossIndustryInvoice>\n';
    const out = await finalizePdf(await samplePdf(), { facturxXml: xml });
    const doc = await PDFDocument.load(out);

    const af = doc.catalog.lookup(PDFName.of("AF"));
    expect(af).toBeDefined();
    const names = doc.catalog.lookup(PDFName.of("Names"), PDFDict);
    const embedded = names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
    const pairs = embedded.lookup(PDFName.of("Names"));
    expect(String(pairs)).toContain("factur-x.xml");

    const filespec = doc.context.enumerateIndirectObjects().map(([, o]) => o).find(
      (o): o is PDFDict => o instanceof PDFDict && o.get(PDFName.of("Type")) === PDFName.of("Filespec")
    );
    expect(filespec?.get(PDFName.of("AFRelationship"))).toBe(PDFName.of("Data"));

    const stream = doc.context.lookup(filespec!.lookup(PDFName.of("EF"), PDFDict).get(PDFName.of("F"))) as PDFRawStream;
    expect(Buffer.from(decodePDFRawStream(stream).decode()).toString("utf-8")).toBe(xml);

    const xmp = await xmpOf(out);
    expect(xmp).toContain("<fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>");
    expect(xmp).toContain("<fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>");
    expect(xmp).toContain("urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#");
    expect(xmp).toContain("pdfaExtension:schemas");
  });
});
