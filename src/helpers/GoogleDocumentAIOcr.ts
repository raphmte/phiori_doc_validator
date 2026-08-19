import {
    DocumentProcessorServiceClient,
    protos,
} from "@google-cloud/documentai";

export type TDocumentAIPage = {
  pageNumber: number;
  text: string;
};

export type TDocumentAIResult = {
  pages: TDocumentAIPage[];
};

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY as string;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID as string;
const GOOGLE_LOCATION = process.env.GOOGLE_LOCATION as string;
const GOOGLE_PROCESSOR_ID = process.env.GOOGLE_PROCESSOR_ID as string;

const client = new DocumentProcessorServiceClient({
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  projectId: GOOGLE_PROJECT_ID,
});

/**
 * Extrai o texto do documento combinado, retornando o texto já paginado por
 * página em vez de um único bloco concatenado. Aceita tanto PDF quanto imagem.
 */
async function extractTextWithDocumentAI(
  buffer: Buffer,
  mimeType: string = "application/pdf",
): Promise<TDocumentAIResult> {
  try {
    const name = `projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/processors/${GOOGLE_PROCESSOR_ID}`;

    const result = await client.processDocument({
      name,
      rawDocument: {
        content: buffer,
        mimeType,
      },
    });

    return { pages: extractPaginatedText(result[0].document) };
  } catch (e: any) {
    console.log(e);
    return { pages: [] };
  }
}

function extractPaginatedText(
  document?: protos.google.cloud.documentai.v1.IDocument | null,
): TDocumentAIPage[] {
  if (!document?.text || !document.pages) {
    return [];
  }

  const fullText = document.text;

  return document.pages.map((page, index) => ({
    pageNumber: page.pageNumber ?? index + 1,
    text: getTextFromSegments(fullText, page.layout?.textAnchor?.textSegments),
  }));
}

function getTextFromSegments(
  fullText: string,
  segments?:
    | protos.google.cloud.documentai.v1.Document.TextAnchor.ITextSegment[]
    | null,
): string {
  if (!segments || segments.length === 0) {
    return "";
  }

  return segments
    .map((segment) =>
      fullText.slice(
        Number(segment.startIndex ?? 0),
        Number(segment.endIndex ?? 0),
      ),
    )
    .join("");
}

export default {
  extractTextWithDocumentAI,
};
