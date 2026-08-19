import { PDFDocument } from "pdf-lib";

// Usado quando o cliente envia os documentos separados (ordem de carregamento, ticket de
// balança, notas fiscais) em vez de um único PDF bulk — junta tudo num PDF só antes do OCR,
// já que o pipeline de extração (Google Document AI + DeepSeek) sempre trabalha em cima de um
// único documento combinado.
async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}

export default {
  mergePdfBuffers,
};
