import type { Company } from "@prisma/client";
import { sellerSnapshotFromCompany } from "@/lib/documents";
import { DEFAULT_BRAND_COLOR, normalizeHexColor } from "@/lib/pdf/colors";
import { legalFooterLines } from "@/lib/pdf/build-data";
import type { ExportReportInput } from "@/lib/pdf/ExportReportPdf";
import { loadCompanyLogo } from "@/lib/pdf/logo-load";
import { renderExportReportBuffer } from "@/lib/pdf/render";
import { loadPaymentRows, loadSalesDocuments } from "./load";
import { buildPaymentsReport, buildSalesReport } from "./report";

export type ExportReportKind = "ventes" | "paiements";

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
      logo: await loadCompanyLogo(company.id),
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
