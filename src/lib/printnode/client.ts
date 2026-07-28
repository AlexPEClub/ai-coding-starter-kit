/**
 * PrintNode REST API Client — für den "QR-Codes drucken"-Button (PROJ-34).
 * Basis-URL: https://api.printnode.com
 * Auth: HTTP Basic, API-Key als Username, leeres Passwort.
 * Doku: https://www.printnode.com/en/docs/api/curl
 */

const PRINTNODE_BASE_URL = "https://api.printnode.com";

function getApiKey(): string {
  const key = process.env.PRINTNODE_API_KEY;
  if (!key) {
    throw new Error("PRINTNODE_API_KEY ist nicht gesetzt. Bitte in .env.local hinzufügen.");
  }
  return key;
}

function getPrinterId(): string {
  const id = process.env.PRINTNODE_PRINTER_ID;
  if (!id) {
    throw new Error("PRINTNODE_PRINTER_ID ist nicht gesetzt. Bitte in .env.local hinzufügen.");
  }
  return id;
}

async function printNodeFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const url = `${PRINTNODE_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PrintNode API Fehler ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Sendet einen Etiketten-PDF-Druckauftrag an den konfigurierten Drucker.
 * Gibt die PrintNode-Job-ID zurück.
 */
export async function printLabelPdf(pdfBase64: string, title: string): Promise<number> {
  const printerId = getPrinterId();

  return printNodeFetch<number>("/printjobs", {
    method: "POST",
    body: JSON.stringify({
      printerId: Number(printerId),
      title,
      contentType: "pdf_base64",
      content: pdfBase64,
      source: "TMS 2.0",
    }),
  });
}
