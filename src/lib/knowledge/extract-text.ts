import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}
