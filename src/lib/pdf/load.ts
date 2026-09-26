import type { Company } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import { buildInvoicePdfData, buildQuotePdfData, type PdfDocumentData } from "./build-data";

export interface LoadedPdf {
  data: PdfDocumentData;
  filename: string;
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

  return { data, filename: isDraft ? `brouillon-${invoice.id}.pdf` : `${invoice.number}.pdf` };
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

  return { data, filename: `${quote.number}.pdf` };
}
