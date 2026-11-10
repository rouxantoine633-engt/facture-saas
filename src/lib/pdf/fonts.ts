import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Police intégrée au PDF (obligatoire pour le PDF/A-3 des factures Factur-X :
 * les polices standard comme Helvetica ne sont pas embarquées). Liberation
 * Sans (SIL OFL 1.1) a les mêmes métriques qu'Helvetica/Arial : la mise en
 * page est inchangée. Chemins littéraux pour que le traçage de fichiers de
 * Next.js embarque les polices dans les fonctions serverless.
 */
export const PDF_FONT = "LiberationSans";
export const PDF_FONT_BOLD = "LiberationSansBold";

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: PDF_FONT,
    src: path.join(process.cwd(), "src/lib/pdf/fonts/LiberationSans-Regular.ttf"),
  });
  Font.register({
    family: PDF_FONT_BOLD,
    src: path.join(process.cwd(), "src/lib/pdf/fonts/LiberationSans-Bold.ttf"),
  });
  registered = true;
}
