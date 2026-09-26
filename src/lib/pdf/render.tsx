import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfDocumentData } from "./build-data";
import { DocumentPdf } from "./DocumentPdf";

export async function pdfResponse(data: PdfDocumentData, filename: string): Promise<Response> {
  const buffer = await renderToBuffer(<DocumentPdf data={data} />);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
