import { requireCompany } from "@/lib/session";
import { toCsv } from "@/lib/export/csv";
import { loadPaymentsJournal, loadSalesJournal } from "@/lib/export/load";
import { parseExportRange } from "@/lib/export/range";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { company } = await requireCompany();
  const params = new URL(request.url).searchParams;

  const range = parseExportRange(params.get("from"), params.get("to"));
  if ("error" in range) return new Response(range.error, { status: 400 });

  const type = params.get("type") === "paiements" ? "paiements" : "ventes";
  const rows =
    type === "ventes"
      ? await loadSalesJournal(company.id, range.from, range.to)
      : await loadPaymentsJournal(company.id, range.from, range.to);

  const filename = `journal-${type}_${params.get("from")}_${params.get("to")}.csv`;
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
