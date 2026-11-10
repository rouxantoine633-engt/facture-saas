import { createHash } from "node:crypto";
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFString } from "pdf-lib";
import { FACTURX_FILENAME } from "./cii";

const FACTURX_NAMESPACE = "urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#";
const FACTURX_CONFORMANCE_LEVEL = "EN 16931";

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pdfDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `D:${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}+00'00'`;
}

function xmpDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

interface XmpFields {
  title: string;
  author: string;
  subject: string;
  producer: string;
  creatorTool: string;
  created: Date;
  modified: Date;
  facturx: boolean;
}

const FACTURX_PROPERTIES: Array<[string, string]> = [
  ["DocumentFileName", "name of the embedded XML invoice file"],
  ["DocumentType", "INVOICE"],
  ["Version", "The actual version of the Factur-X XML schema"],
  ["ConformanceLevel", "The conformance level of the embedded Factur-X data"],
];

/**
 * Métadonnées XMP du PDF/A-3. Pour un Factur-X, on y déclare le schéma
 * d'extension « fx » et les propriétés du fichier embarqué, tels que la
 * spécification Factur-X les impose.
 */
function buildXmp(f: XmpFields): string {
  const facturxExtension = f.facturx
    ? `<rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">` +
      `<pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource">` +
      `<pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>` +
      `<pdfaSchema:namespaceURI>${FACTURX_NAMESPACE}</pdfaSchema:namespaceURI>` +
      `<pdfaSchema:prefix>fx</pdfaSchema:prefix>` +
      `<pdfaSchema:property><rdf:Seq>` +
      FACTURX_PROPERTIES.map(
        ([name, description]) =>
          `<rdf:li rdf:parseType="Resource"><pdfaProperty:name>${name}</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>${xmlEscape(description)}</pdfaProperty:description></rdf:li>`
      ).join("") +
      `</rdf:Seq></pdfaSchema:property></rdf:li></rdf:Bag></pdfaExtension:schemas></rdf:Description>` +
      `<rdf:Description rdf:about="" xmlns:fx="${FACTURX_NAMESPACE}">` +
      `<fx:DocumentType>INVOICE</fx:DocumentType>` +
      `<fx:DocumentFileName>${FACTURX_FILENAME}</fx:DocumentFileName>` +
      `<fx:Version>1.0</fx:Version>` +
      `<fx:ConformanceLevel>${FACTURX_CONFORMANCE_LEVEL}</fx:ConformanceLevel>` +
      `</rdf:Description>`
    : "";

  return (
    `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n` +
    `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">` +
    `<rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"><pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance></rdf:Description>` +
    `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
    `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(f.title)}</rdf:li></rdf:Alt></dc:title>` +
    `<dc:creator><rdf:Seq><rdf:li>${xmlEscape(f.author)}</rdf:li></rdf:Seq></dc:creator>` +
    `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(f.subject)}</rdf:li></rdf:Alt></dc:description>` +
    `</rdf:Description>` +
    `<rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdf:Producer>${xmlEscape(f.producer)}</pdf:Producer></rdf:Description>` +
    `<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">` +
    `<xmp:CreatorTool>${xmlEscape(f.creatorTool)}</xmp:CreatorTool>` +
    `<xmp:CreateDate>${xmpDate(f.created)}</xmp:CreateDate>` +
    `<xmp:ModifyDate>${xmpDate(f.modified)}</xmp:ModifyDate>` +
    `</rdf:Description>` +
    facturxExtension +
    `</rdf:RDF></x:xmpmeta>\n<?xpacket end="w"?>`
  );
}

/**
 * Finalise un PDF/A-3b produit par react-pdf : réécrit le XMP (celui de
 * react-pdf n'échappe pas les « & » des titres, ce qui le rend invalide) et,
 * s'il y a un XML Factur-X, l'embarque comme pièce jointe « Data » déclarée
 * dans le catalogue (/AF et /Names), avec ses propriétés XMP.
 */
export async function finalizePdf(pdf: Uint8Array, options: { facturxXml?: string } = {}): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const ctx = doc.context;
  const catalog = doc.catalog;

  const created = doc.getCreationDate() ?? new Date();
  const modified = doc.getModificationDate() ?? created;
  doc.setModificationDate(modified);

  const xmp = buildXmp({
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    producer: doc.getProducer() ?? "react-pdf",
    creatorTool: doc.getCreator() ?? "react-pdf",
    created,
    modified,
    facturx: options.facturxXml !== undefined,
  });
  const xmpStream = ctx.stream(Buffer.from(xmp, "utf-8"), { Type: "Metadata", Subtype: "XML" });
  const existingMetadata = catalog.get(PDFName.of("Metadata"));
  if (existingMetadata instanceof PDFRef) ctx.assign(existingMetadata, xmpStream);
  else catalog.set(PDFName.of("Metadata"), ctx.register(xmpStream));

  if (options.facturxXml !== undefined) {
    const xmlBytes = Buffer.from(options.facturxXml, "utf-8");
    const fileStream = ctx.flateStream(xmlBytes, {
      Type: "EmbeddedFile",
      Subtype: "text/xml",
      Params: {
        Size: xmlBytes.length,
        ModDate: PDFString.of(pdfDate(modified)),
        CheckSum: PDFHexString.of(createHash("md5").update(xmlBytes).digest("hex")),
      },
    });
    const fileRef = ctx.register(fileStream);
    const filespecRef = ctx.register(
      ctx.obj({
        Type: "Filespec",
        F: PDFString.of(FACTURX_FILENAME),
        UF: PDFString.of(FACTURX_FILENAME),
        EF: { F: fileRef, UF: fileRef },
        Desc: PDFString.of("Factur-X XML file"),
        AFRelationship: "Data",
      })
    );

    // react-pdf crée déjà un dictionnaire /Names : on le complète sans l'écraser.
    const names = catalog.lookupMaybe(PDFName.of("Names"), PDFDict) ?? ctx.obj({});
    names.set(PDFName.of("EmbeddedFiles"), ctx.obj({ Names: [PDFString.of(FACTURX_FILENAME), filespecRef] }));
    catalog.set(PDFName.of("Names"), names);
    catalog.set(PDFName.of("AF"), ctx.obj([filespecRef]) as PDFArray);
    catalog.set(PDFName.of("PageMode"), PDFName.of("UseAttachments"));
  }

  return Buffer.from(await doc.save({ useObjectStreams: false }));
}
