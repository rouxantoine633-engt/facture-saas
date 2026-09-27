import { requireCompany } from "@/lib/session";
import { loadQuotePdf } from "@/lib/pdf/load";
import { pdfResponse } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany();
  const loaded = await loadQuotePdf(company, id);
  if (!loaded) return new Response("Devis introuvable", { status: 404 });
  return pdfResponse(loaded.data, loaded.filename);
}
