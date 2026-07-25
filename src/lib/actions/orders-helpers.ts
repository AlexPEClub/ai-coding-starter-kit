/**
 * Escaped einen Suchbegriff für die Einbettung in einen PostgREST
 * `.or()`-Filter-String. Ohne Escaping könnten Zeichen wie `,` oder `)`
 * die Filter-Syntax verändern und zusätzliche Bedingungen einschleusen
 * (gefunden bei QA, siehe BUG-2 in features/PROJ-11-kundendetailseite.md).
 * PostgREST erlaubt doppelt gequotete Filterwerte, um Sonderzeichen wörtlich
 * zu behandeln — darin müssen nur Backslash und Anführungszeichen escaped werden.
 */
export function escapeOrFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export interface OrderGroupStat {
  group_id: number;
  group_name: string;
  count: number;
}

/** Design-System-Chartfarben, verbindliche Reihenfolge (docs/design-system.md). */
export const CHART_GROUP_COLORS = ["#FF6B6D", "#4ECDC4", "#7C6CFF", "#F59F00", "#4DABF7", "#2FB344"];

export type ProductGroupInfo = { group_id: number | null; group_name: string | null };

/**
 * Wandelt einen ganzzahligen Cent-Betrag (so speichert Easybill Preise in
 * `tms.invoice_items`, z.B. 1840 = 18,40 €) in einen Euro-Betrag um. Die UI
 * formatiert den Rückgabewert direkt als Euro (siehe BUG-6). null/undefined → 0.
 */
export function centsToEuro(cents: number | null | undefined): number {
  return cents ? Number(cents) / 100 : 0;
}

/**
 * Teilt ein Array in Blöcke fester Größe. Wird genutzt, um `.in(...)`-Lookups
 * zu stückeln, damit die PostgREST-Query-URL kurz bleibt (BUG-5: „URI too long"
 * bei Kunden mit sehr vielen verschiedenen Artikeln).
 */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Entscheidet, ob eine Bestellposition in der Tabelle gezeigt wird:
 * - kein Eintrag in der Map (kein Produkt-Match / type!='PRODUCT') → ausgeblendet
 * - bei aktivem Gruppenfilter (`groupId`) → nur passende Gruppe
 * Positionen eines Produkts ohne Gruppe (group_id=null) bleiben sichtbar,
 * solange kein Gruppenfilter aktiv ist (siehe Spec 2.4.1 Edge Cases).
 */
export function rowQualifies(
  articleNumber: string | null,
  numberToGroup: Map<string, ProductGroupInfo>,
  groupId?: number
): boolean {
  const group = numberToGroup.get(articleNumber || "");
  if (!group) return false;
  if (groupId !== undefined && group.group_id !== groupId) return false;
  return true;
}

/**
 * Zählt Bestellpositionen je Artikelgruppe (Anzahl Rechnungszeilen, nicht
 * Mengen-Summe). Positionen ohne Gruppe fließen bewusst nicht ein — sie
 * sollen im Donut-Chart/Dropdown nicht auftauchen (siehe Decision Log in
 * features/PROJ-11-kundendetailseite.md).
 * Ergebnis absteigend nach Häufigkeit sortiert.
 */
export function buildGroupStats(
  articleNumbers: (string | null)[],
  numberToGroup: Map<string, ProductGroupInfo>
): OrderGroupStat[] {
  const counts = new Map<number, { group_name: string; count: number }>();
  for (const articleNumber of articleNumbers) {
    const group = numberToGroup.get(articleNumber || "");
    if (!group?.group_id || !group.group_name) continue;
    const existing = counts.get(group.group_id);
    counts.set(group.group_id, {
      group_name: group.group_name,
      count: (existing?.count ?? 0) + 1,
    });
  }

  return [...counts.entries()]
    .map(([group_id, v]) => ({ group_id, group_name: v.group_name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}
