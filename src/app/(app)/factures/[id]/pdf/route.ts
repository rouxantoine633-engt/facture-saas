import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import { buildInvoicePdfData } from "@/lib/pdf/build-data";
import { pdfResponse } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { company } = await requireCompany();
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!invoice) return new Response("Facture introuvable", { status: 404 });

  const isDraft = invoice.status === "DRAFT";
  // Une facture émise est toujours rendue depuis ses mentions figées à l'émission.
  const seller = (isDraft ? sellerSnapshotFromCompany(company) : invoice.sellerLegalSnapshot) as SellerSnapshot | null;
  const buyer = (isDraft ? buyerSnapshotFromClient(invoice.client) : invoice.buyerLegalSnapshot) as BuyerSnapshot | null;
  if (!seller || !buyer) return new Response("Mentions légales de la facture manquantes", { status: 500 });

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

  return pdfResponse(data, isDraft ? `brouillon-${invoice.id}.pdf` : `${invoice.number}.pdf`);
}
