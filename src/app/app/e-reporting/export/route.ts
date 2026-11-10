import { requireActiveCompany } from "@/lib/session";
import { loadEReporting } from "@/lib/ereporting/load";
import { paymentsCsv, reportJson, transactionsCsv } from "@/lib/ereporting/export";
import { parseExportRange } from "@/lib/export/range";

export const runtime = "nodejs";

const TYPES = ["transactions", "encaissements", "json"] as const;

export async function GET(request: Request) {
  const { company } = await requireActiveCompany();
  const params = new URL(request.url).searchParams;

  const range = parseExportRange(params.get("from"), params.get("to"));
  if ("error" in range) return new Response(range.error, { status: 400 });

  const type = TYPES.find((t) => t === params.get("type"));
  if (!type) return new Response("Type d'export inconnu.", { status: 400 });

  const report = await loadEReporting(company.id, range.from, range.to);
  const period = { from: params.get("from")!, to: params.get("to")! };
  const body =
    type === "transactions" ? transactionsCsv(report) : type === "encaissements" ? paymentsCsv(report) : reportJson(report, period);
  const extension = type === "json" ? "json" : "csv";
  const contentType = type === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="e-reporting-${type}_${period.from}_${period.to}.${extension}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
