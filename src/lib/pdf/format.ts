import { formatCentsToEuros } from "@/lib/money";

/**
 * Intl produit des espaces insécables fines (U+202F / U+00A0) absentes de la
 * police Helvetica intégrée au PDF : elles s'afficheraient comme des carrés.
 */
export function formatEurosForPdf(cents: number): string {
  return formatCentsToEuros(cents).replace(/[  ]/g, " ");
}

export function formatRate(ratePer100000: number): string {
  return `${(ratePer100000 / 1000).toLocaleString("fr-FR")} %`.replace(/[  ]/g, " ");
}
