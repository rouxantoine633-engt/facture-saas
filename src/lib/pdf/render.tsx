import { renderToBuffer } from "@react-pdf/renderer";
import { buildCiiXml, FacturXError, type FacturXInput } from "@/lib/facturx/cii";
import { finalizePdf } from "@/lib/facturx/embed";
import type { PdfDocumentData } from "./build-data";
import { DocumentPdf } from "./DocumentPdf";
import type { LoadedPdf } from "./load";

/**
 * Génère le XML Factur-X, ou `undefined` si le document ne s'y prête pas (donnée
 * manquante sur une ancienne fiche, par exemple) : le PDF reste alors téléchargeable
 * et envoyable, sans XML embarqué, plutôt que d'échouer.
 */
function facturxXmlOrUndefined(input: FacturXInput | undefined): string | undefined {
  if (!input) return undefined;
  try {
    return buildCiiXml(input);
  } catch (e) {
    if (e instanceof FacturXError) {
      console.warn(`Factur-X non généré pour ${input.number} : ${e.message}`);
      return undefined;
    }
    throw e;
  }
}

/** PDF/A-3b ; avec un `facturx`, devient un Factur-X (PDF + XML structuré embarqué). */
export async function renderPdfBuffer(data: PdfDocumentData, facturx?: FacturXInput): Promise<Buffer> {
  const base = await renderToBuffer(<DocumentPdf data={data} />);
  return finalizePdf(base, { facturxXml: facturxXmlOrUndefined(facturx) });
}

export async function pdfResponse(loaded: LoadedPdf): Promise<Response> {
  const buffer = await renderPdfBuffer(loaded.data, loaded.facturx);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${loaded.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
