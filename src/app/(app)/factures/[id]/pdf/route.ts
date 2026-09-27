import { requireCompany } from "@/lib/session";
import { loadInvoicePdf } from "@/lib/pdf/load";
import { pdfResponse } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany();
  const loaded = await loadInvoicePdf(company, id);
  if (!loaded) return new Response("Facture introuvable", { status: 404 });
  return pdfResponse(loaded.data, loaded.filename);
}
