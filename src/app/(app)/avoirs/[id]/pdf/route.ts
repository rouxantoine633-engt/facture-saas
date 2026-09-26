import { requireCompany } from "@/lib/session";
import { loadCreditNotePdf } from "@/lib/pdf/load";
import { pdfResponse } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { company } = await requireCompany();
  const loaded = await loadCreditNotePdf(company, params.id);
  if (!loaded) return new Response("Avoir introuvable", { status: 404 });
  return pdfResponse(loaded.data, loaded.filename);
}
