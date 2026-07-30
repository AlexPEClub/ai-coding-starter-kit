/**
 * Reine, DB-freie Logik aus PROJ-35 — für Unit-Tests ohne Supabase-Mock.
 */

export type Wertebereich = { von: number; bis: number | null };

/**
 * Prüft, ob sich ein neuer Wertebereich mit einem der bestehenden Bereiche
 * überschneidet. Bereiche sind auf beiden Seiten inklusiv (von <= x <= bis),
 * `bis === null` bedeutet offene Obergrenze ("ab X").
 */
export function ueberschneidetSichMitBestehenden(
  bestehende: Wertebereich[],
  neu: Wertebereich,
): boolean {
  return bestehende.some((b) => {
    const bBis = b.bis ?? Infinity;
    const neuBis = neu.bis ?? Infinity;
    return neu.von <= bBis && b.von <= neuBis;
  });
}
