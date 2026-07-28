import QRCode from "qrcode";
import { PDFDocument, StandardFonts } from "pdf-lib";

// Etiketten-Format des Zebra ZD421 (Thermodrucker, kein A4-Bürodrucker) —
// ein Etikett pro PDF-Seite, kein Raster. Default 57×32mm (gängige kleine
// Geräte-/Werkzeug-Etiketten); bei Bedarf hier zentral anpassen.
const MM_TO_PT = 2.83464567;
const LABEL_WIDTH_PT = 57 * MM_TO_PT;
const LABEL_HEIGHT_PT = 32 * MM_TO_PT;
const MARGIN_PT = 4 * MM_TO_PT;
const QR_SIZE_PT = LABEL_HEIGHT_PT - 2 * MARGIN_PT;

/**
 * Erzeugt ein druckfertiges Etiketten-PDF (Base64) — eine Seite pro Code,
 * exakt im Etikettenformat des Zebra ZD421 (nicht A4).
 */
export async function generateQrLabelSheetPdf(codes: string[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const code of codes) {
    const page = pdfDoc.addPage([LABEL_WIDTH_PT, LABEL_HEIGHT_PT]);

    const qrDataUrl = await QRCode.toDataURL(code, { margin: 0, width: 200 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawImage(qrImage, {
      x: MARGIN_PT,
      y: MARGIN_PT,
      width: QR_SIZE_PT,
      height: QR_SIZE_PT,
    });

    const textX = MARGIN_PT + QR_SIZE_PT + 6;
    page.drawText(code, {
      x: textX,
      y: LABEL_HEIGHT_PT / 2 - 4,
      size: 8,
      font,
      maxWidth: LABEL_WIDTH_PT - textX - MARGIN_PT,
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes).toString("base64");
}
