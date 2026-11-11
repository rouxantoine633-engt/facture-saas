import type { Company } from "@prisma/client";
import { sellerSnapshotFromCompany } from "@/lib/documents";
import { inspectLogo } from "@/lib/logo";
import { DEFAULT_BRAND_COLOR, normalizeHexColor } from "@/lib/pdf/colors";
import { legalFooterLines } from "@/lib/pdf/build-data";
import type { ExportReportInput, ReportLogo } from "@/lib/pdf/ExportReportPdf";
import { prisma } from "@/lib/prisma";
import { renderExportReportBuffer } from "@/lib/pdf/render";
import { loadPaymentRows, loadSalesDocuments } from "./load";
import { buildPaymentsReport, buildSalesReport } from "./report";

export type ExportReportKind = "ventes" | "paiements";

/** Logo de l'entreprise, ou `undefined` s'il n'y en a pas ou s'il est illisible (le rapport reste alors sans logo). */
async function loadLogo(companyId: string): Promise<ReportLogo | undefined> {
  const stored = await prisma.companyLogo.findUnique({ where: { companyId } });
  if (!stored) return undefined;
  const data = Buffer.from(stored.data);
  const checked = inspectLogo(data);
  return checked.ok ? { data, format: checked.format, width: checked.width, height: checked.height } : undefined;
}

/** Rapport PDF d'un journal (ventes ou encaissements) sur la période [from, to], aux couleurs de l'entreprise. */
export async function buildExportReportPdf(params: {
  company: Company;
  kind: ExportReportKind;
  from: Date;
  to: Date;
}): Promise<Buffer> {
  const { company, kind, from, to } = params;
  const base = {
    company: {
      legalName: company.legalName,
      brandColor: normalizeHexColor(company.brandColor) ?? DEFAULT_BRAND_COLOR,
      logo: await loadLogo(company.id),
      footerLines: legalFooterLines(sellerSnapshotFromCompany(company)),
    },
    period: { from, to },
    generatedAt: new Date(),
  };

  const input: ExportReportInput =
    kind === "ventes"
      ? { ...base, kind: "SALES", report: buildSalesReport(await loadSalesDocuments(company.id, from, to)) }
      : { ...base, kind: "PAYMENTS", report: buildPaymentsReport(await loadPaymentRows(company.id, from, to)) };

  return renderExportReportBuffer(input);
}
