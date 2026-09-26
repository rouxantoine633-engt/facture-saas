import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfDocumentData } from "./build-data";
import { DocumentPdf } from "./DocumentPdf";

export async function renderPdfBuffer(data: PdfDocumentData): Promise<Buffer> {
  return renderToBuffer(<DocumentPdf data={data} />);
}

export async function pdfResponse(data: PdfDocumentData, filename: string): Promise<Response> {
  const buffer = await renderPdfBuffer(data);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
