import { z } from "zod";

/** Gescannter oder manuell eingegebener QR-Code-Inhalt. */
export const qrCodeSchema = z.string().trim().min(1, "Code darf nicht leer sein");
export type QrCodeInput = z.infer<typeof qrCodeSchema>;

/** Gesamtgewicht einer Sendung inkl. Verpackung, in kg. */
export const gesamtgewichtSchema = z.coerce
  .number({ message: "Gesamtgewicht muss eine Zahl sein" })
  .positive("Gesamtgewicht muss größer als 0 sein");
export type GesamtgewichtInput = z.infer<typeof gesamtgewichtSchema>;

/** Bezeichnung einer neuen (statischen) Kommission. */
export const kommissionBezeichnungSchema = z
  .string()
  .trim()
  .min(1, "Bezeichnung darf nicht leer sein")
  .max(200, "Höchstens 200 Zeichen");
export type KommissionBezeichnungInput = z.infer<typeof kommissionBezeichnungSchema>;

/** Freitext-Kommission (dynamischer Typ). */
export const kommissionFreitextSchema = z.string().trim().max(200, "Höchstens 200 Zeichen");

/** Notiz zu einem Werkzeug ohne Code. */
export const ohneCodeNotizSchema = z.string().trim().max(500, "Höchstens 500 Zeichen");

/** Anzahl der zu druckenden QR-Code-Etiketten. */
export const druckAnzahlSchema = z.coerce
  .number({ message: "Anzahl muss eine Zahl sein" })
  .int("Anzahl muss eine ganze Zahl sein")
  .positive("Anzahl muss größer als 0 sein")
  .max(500, "Höchstens 500 Etiketten pro Charge");
export type DruckAnzahlInput = z.infer<typeof druckAnzahlSchema>;
