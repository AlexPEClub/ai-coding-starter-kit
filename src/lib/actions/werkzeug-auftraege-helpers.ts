// Reine, DB-freie Hilfsfunktionen aus werkzeug-auftraege.ts — hier ausgelagert,
// damit die Geschäftsregeln unabhängig von Supabase getestet werden können
// (analog zu orders-helpers.ts).

import type { KommissionEinstellung } from "./order-defaults";

export const KOMMISSION_PFLICHT_FEHLER = "Kommission ist für diesen Kunden Pflicht.";

/**
 * Prüft, ob die Kommissions-Pflicht eines Kunden erfüllt ist. Gibt eine
 * Fehlermeldung zurück, wenn nicht — oder `null`, wenn alles passt (keine
 * Pflicht, oder Pflicht + passendes Feld befüllt).
 */
export function kommissionsPflichtFehler(
  einstellung: Pick<KommissionEinstellung, "pflicht" | "typ">,
  auftrag: { kommission_id: string | null; kommission_freitext: string | null }
): string | null {
  if (!einstellung.pflicht) return null;
  if (einstellung.typ === "statisch" && !auftrag.kommission_id) {
    return KOMMISSION_PFLICHT_FEHLER;
  }
  if (einstellung.typ === "dynamisch" && !auftrag.kommission_freitext?.trim()) {
    return KOMMISSION_PFLICHT_FEHLER;
  }
  return null;
}
