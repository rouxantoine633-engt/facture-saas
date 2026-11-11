import { requireActiveCompany } from "@/lib/session";
import { toCsv } from "@/lib/export/csv";
import { loadPaymentsJournal, loadSalesJournal } from "@/lib/export/load";
import { parseExportRange } from "@/lib/export/range";
import { buildExportReportPdf } from "@/lib/export/report-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { company } = await requireActiveCompany();
  const params = new URL(request.url).searchParams;

  const range = parseExportRange(params.get("from"), params.get("to"));
  if ("error" in range) return new Response(range.error, { status: 400 });

  const type = params.get("type") === "paiements" ? "paiements" : "ventes";
  const format = params.get("format") === "pdf" ? "pdf" : "csv";
  const basename = `journal-${type}_${params.get("from")}_${params.get("to")}`;

  if (format === "pdf") {
    const pdf = await buildExportReportPdf({ company, kind: type, from: range.from, to: range.to });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${basename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const rows =
    type === "ventes"
      ? await loadSalesJournal(company.id, range.from, range.to)
      : await loadPaymentsJournal(company.id, range.from, range.to);

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${basename}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
