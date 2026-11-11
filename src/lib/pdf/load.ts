import type { Company } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import type { FacturXInput } from "@/lib/facturx/cii";
import { loadCompanyLogo } from "./logo-load";
import { buildCreditNotePdfData, buildInvoicePdfData, buildQuotePdfData, type PdfDocumentData } from "./build-data";

export interface LoadedPdf {
  data: PdfDocumentData;
  filename: string;
  /** Présent pour une facture ou un avoir émis à un client professionnel : le PDF embarque alors son XML Factur-X. */
  facturx?: FacturXInput;
}

export async function loadInvoicePdf(company: Company, invoiceId: string): Promise<LoadedPdf | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!invoice) return null;

  const isDraft = invoice.status === "DRAFT";
  // Une facture émise est toujours rendue depuis ses mentions figées à l'émission.
  const seller = (isDraft ? sellerSnapshotFromCompany(company) : invoice.sellerLegalSnapshot) as SellerSnapshot | null;
  const buyer = (isDraft ? buyerSnapshotFromClient(invoice.client) : invoice.buyerLegalSnapshot) as BuyerSnapshot | null;
  if (!seller || !buyer) throw new Error(`Mentions légales manquantes sur la facture ${invoice.id}`);

  const data = buildInvoicePdfData({
    number: invoice.number,
    isDraft,
    issueDate: invoice.issueDate,
    serviceDate: invoice.serviceDate,
    dueDate: invoice.dueDate,
    operationCategory: invoice.operationCategory,
    originQuoteNumber: invoice.originQuoteNumber,
    originQuoteDate: invoice.originQuoteDate,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity.toString(),
      unitPriceCents: l.unitPriceCents,
      vatRatePer100000: l.vatRatePer100000,
      lineHtCents: l.lineHtCents,
      lineVatCents: l.lineVatCents,
      lineTtcCents: l.lineTtcCents,
    })),
    seller,
    buyer,
    latePenaltyRateText: (isDraft ? company.latePenaltyRateText : invoice.latePenaltyRateText) ?? "",
    recoveryIndemnityCents: (isDraft ? company.recoveryIndemnityCents : invoice.recoveryIndemnityCents) ?? 0,
    discountPolicyText: (isDraft ? company.discountPolicyText : invoice.discountPolicyText) ?? "",
  });
  data.logo = await loadCompanyLogo(company.id);

  // Un brouillon n'est pas une facture (pas de numéro légal) ; les ventes aux particuliers
  // relèvent du e-reporting. Dans les deux cas : PDF simple, sans XML.
  const facturx: FacturXInput | undefined =
    isDraft || buyer.type !== "BUSINESS"
      ? undefined
      : {
          kind: "INVOICE",
          number: invoice.number,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          serviceDate: invoice.serviceDate,
          operationCategory: invoice.operationCategory,
          seller,
          buyer,
          lines: data.lines,
          totals: data.totals,
          settlement: {
            latePenaltyText: invoice.latePenaltyRateText ?? "",
            recoveryIndemnityCents: invoice.recoveryIndemnityCents ?? 0,
            discountText: invoice.discountPolicyText ?? "",
          },
        };

  return { data, filename: isDraft ? `brouillon-${invoice.id}.pdf` : `${invoice.number}.pdf`, facturx };
}

export async function loadQuotePdf(company: Company, quoteId: string): Promise<LoadedPdf | null> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) return null;

  const data = buildQuotePdfData({
    number: quote.number,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    notes: quote.notes,
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity.toString(),
      unitPriceCents: l.unitPriceCents,
      vatRatePer100000: l.vatRatePer100000,
      lineHtCents: l.lineHtCents,
      lineVatCents: l.lineVatCents,
      lineTtcCents: l.lineTtcCents,
    })),
    seller: sellerSnapshotFromCompany(company),
    buyer: buyerSnapshotFromClient(quote.client),
  });
  data.logo = await loadCompanyLogo(company.id);

  return { data, filename: `${quote.number}.pdf` };
}

export async function loadCreditNotePdf(company: Company, creditNoteId: string): Promise<LoadedPdf | null> {
  const note = await prisma.creditNote.findFirst({
    where: { id: creditNoteId, companyId: company.id },
    include: { invoice: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!note) return null;

  const seller = note.sellerLegalSnapshot as SellerSnapshot | null;
  const buyer = note.buyerLegalSnapshot as BuyerSnapshot | null;
  if (!seller || !buyer) throw new Error(`Mentions légales manquantes sur l'avoir ${note.id}`);

  const data = buildCreditNotePdfData({
    number: note.number,
    issueDate: note.issueDate,
    invoiceNumber: note.invoice.number,
    invoiceDate: note.invoice.issueDate,
    operationCategory: note.invoice.operationCategory,
    reason: note.reason,
    lines: note.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity.toString(),
      unitPriceCents: l.unitPriceCents,
      vatRatePer100000: l.vatRatePer100000,
      lineHtCents: l.lineHtCents,
      lineVatCents: l.lineVatCents,
      lineTtcCents: l.lineTtcCents,
    })),
    seller,
    buyer,
  });
  data.logo = await loadCompanyLogo(company.id);

  const facturx: FacturXInput | undefined =
    buyer.type !== "BUSINESS"
      ? undefined
      : {
          kind: "CREDIT_NOTE",
          number: note.number,
          issueDate: note.issueDate,
          operationCategory: note.invoice.operationCategory,
          seller,
          buyer,
          lines: data.lines,
          totals: data.totals,
          // Les mentions de règlement sont celles, figées, de la facture rectifiée.
          settlement: {
            latePenaltyText: note.invoice.latePenaltyRateText ?? "",
            recoveryIndemnityCents: note.invoice.recoveryIndemnityCents ?? 0,
            discountText: note.invoice.discountPolicyText ?? "",
          },
          rectifiedInvoice: { number: note.invoice.number, issueDate: note.invoice.issueDate },
        };

  return { data, filename: `${note.number}.pdf`, facturx };
}
