import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import { buildQuotePdfData } from "@/lib/pdf/build-data";
import { pdfResponse } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { company } = await requireCompany();
  const quote = await prisma.quote.findFirst({
    where: { id: params.id, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) return new Response("Devis introuvable", { status: 404 });

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

  return pdfResponse(data, `${quote.number}.pdf`);
}
