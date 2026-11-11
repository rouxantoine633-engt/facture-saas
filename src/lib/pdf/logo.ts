/** Logo prêt à être inséré dans un PDF (contrôlé à l'import : voir `inspectLogo`). */
export interface PdfLogo {
  data: Buffer;
  format: "png" | "jpg";
  /** Dimensions de l'image en pixels. */
  width: number;
  height: number;
}

export interface LogoBox {
  width: number;
  height: number;
}

/** Emplacement du logo dans l'en-tête des devis, factures et avoirs. */
export const DOCUMENT_LOGO_BOX: LogoBox = { width: 150, height: 56 };
/** Emplacement du logo dans l'en-tête des rapports d'export. */
export const REPORT_LOGO_BOX: LogoBox = { width: 130, height: 44 };

/**
 * Taille d'affichage (en points) d'un logo dans un emplacement donné : proportions conservées, jamais plus grand
 * que l'emplacement, et jamais agrandi au-delà de sa taille d'origine (un petit logo agrandi serait flou).
 * Un logo très large ou très haut est donc réduit pour tenir, sans jamais déformer ni déborder sur l'en-tête.
 */
export function fitLogo(logo: Pick<PdfLogo, "width" | "height">, box: LogoBox): { width: number; height: number } {
  const scale = Math.min(box.width / logo.width, box.height / logo.height, 1);
  return {
    width: Math.max(1, Math.round(logo.width * scale)),
    height: Math.max(1, Math.round(logo.height * scale)),
  };
}
