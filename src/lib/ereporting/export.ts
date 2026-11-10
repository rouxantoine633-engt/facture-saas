import { csvAmount, toCsv } from "@/lib/export/csv";
import type { EReportingReport } from "./aggregate";
import { EREPORTING_CATEGORY_LABELS } from "./categories";

export const EREPORTING_JSON_FORMAT = "onyx-ereporting-preparatoire-v1";

const rateLabel = (ratePer100000: number) => `${(ratePer100000 / 1000).toLocaleString("fr-FR")} %`;

export function transactionsCsv(report: EReportingReport): string {
  return toCsv([
    ["Date", "Catégorie", "Taux de TVA", "Total HT", "Total TVA", "Total TTC", "Documents concernés"],
    ...report.transactions.map((r) => [
      r.date,
      r.category,
      rateLabel(r.vatRatePer100000),
      csvAmount(r.htCents),
      csvAmount(r.vatCents),
      csvAmount(r.ttcCents),
      String(r.documentCount),
    ]),
  ]);
}

export function paymentsCsv(report: EReportingReport): string {
  return toCsv([
    ["Date d'encaissement", "Catégorie", "Taux de TVA", "Montant encaissé TTC", "dont TVA"],
    ...report.payments.map((r) => [
      r.date,
      r.category,
      rateLabel(r.vatRatePer100000),
      csvAmount(r.ttcCents),
      csvAmount(r.vatCents),
    ]),
  ]);
}

/**
 * Données d'e-reporting prêtes à être transmises à une plateforme agréée. Ce n'est PAS le fichier du flux 10 :
 * la plateforme choisie impose son propre format d'entrée. Les montants sont en centimes.
 */
export function reportJson(report: EReportingReport, period: { from: string; to: string }): string {
  return JSON.stringify(
    {
      format: EREPORTING_JSON_FORMAT,
      avertissement:
        "Données préparatoires d'e-reporting (ventes aux particuliers). Ce fichier n'est pas un flux officiel : à convertir selon le format de votre plateforme agréée.",
      periode: period,
      categories: EREPORTING_CATEGORY_LABELS,
      transactions: report.transactions.map((r) => ({
        date: r.date,
        categorie: r.category,
        tauxTvaPourCent: r.vatRatePer100000 / 1000,
        documents: r.documentCount,
        totalHtCents: r.htCents,
        totalTvaCents: r.vatCents,
        totalTtcCents: r.ttcCents,
      })),
      comptageParJour: report.dailyCounts.map((c) => ({
        date: c.date,
        categorie: c.category,
        factures: c.invoiceCount,
        avoirs: c.creditNoteCount,
      })),
      encaissements: report.payments.map((r) => ({
        date: r.date,
        categorie: r.category,
        tauxTvaPourCent: r.vatRatePer100000 / 1000,
        encaisseTtcCents: r.ttcCents,
        dontTvaCents: r.vatCents,
      })),
      avertissements: report.warnings,
    },
    null,
    2
  );
}
