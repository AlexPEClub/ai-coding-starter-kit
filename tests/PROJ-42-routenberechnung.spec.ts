import { test, expect } from "@playwright/test";

/**
 * PROJ-42 — Routenberechnung für Touren (Geoapify)
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden, gleiches Muster
 * wie PROJ-41-fahrt-bearbeiten.spec.ts). Deckt die eine Ende-zu-Ende
 * verifizierbare Garantie dieses Features ab: eine Fahrer/Datum-Änderung
 * löst im Hintergrund eine Neuberechnung aus (server-seitig bestätigt über
 * `loeseNeuberechnungAus`/`berechneUndSpeichereRoute`), OHNE dass ein
 * Fehlschlag der Berechnung (z. B. fehlende Geoapify-Konfiguration) das
 * eigentliche Speichern von Fahrer/Datum verhindert.
 *
 * Die "erfolgreiche Berechnung" selbst (Reihenfolge/Distanz/Fahrzeit/
 * Ankunftszeit) ist NICHT Teil dieses Live-Tests — dafür fehlt aktuell ein
 * konfigurierter GEOAPIFY_API_KEY und ein durchgeführter Backfill-Lauf.
 * Diese Logik ist stattdessen vollständig durch Unit-Tests abgedeckt
 * (src/lib/routing/tour-route.test.ts, src/lib/actions/fahrten-helpers.test.ts).
 *
 * Setzt am Ende den Ursprungszustand zurück, damit die Live-Daten
 * unverändert bleiben (identisches Muster zu PROJ-41).
 */

const FAHRER_EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";
const REFRESH_WARTEZEIT = 2000;

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(FAHRER_EMAIL);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

async function oeffneMechthild0607(page: import("@playwright/test").Page) {
  await page.goto("/fahrer");
  await page.getByRole("tab", { name: "Tourenplanung" }).click();
  await page.getByRole("button", { name: /06\.07\.2026.*Mechthild Gudel — 7 Stopps/s }).click();
}

test.describe("PROJ-42 Routenberechnung — Neuberechnungs-Trigger blockiert nie das Speichern", () => {
  test("Fahrer/Datum-Änderung speichert erfolgreich, obwohl die Routenberechnung im Hintergrund (noch) fehlschlägt", async ({
    page,
  }) => {
    await login(page);
    await oeffneMechthild0607(page);

    await page.getByRole("button", { name: /Tönnissen Erich GmbH/ }).click();
    await page.getByRole("combobox", { name: "Fahrer auswählen" }).click();
    await page.getByRole("option", { name: "Christian Gudel" }).click();
    await page.waitForTimeout(200);
    await page.locator("#fahrt-datum").fill("2026-07-09");
    await page.getByRole("button", { name: "Speichern" }).click();

    // PROJ-42: das eigentliche Speichern muss erfolgreich durchlaufen, auch
    // wenn die im Hintergrund ausgelöste Routenberechnung fehlschlägt (aktuell
    // mangels GEOAPIFY_API_KEY/Depot-Konfiguration serverseitig geloggt, aber
    // bewusst nie nach außen geworfen — siehe loeseNeuberechnungAus).
    await expect(page.getByText("Gespeichert.")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(REFRESH_WARTEZEIT);

    await expect(
      page.getByRole("button", { name: /09\.07\.2026.*Christian Gudel/s })
    ).toBeVisible({ timeout: 10000 });

    // Zurücksetzen, damit die Live-Daten unverändert bleiben.
    await page.getByRole("button", { name: /09\.07\.2026.*Christian Gudel/s }).click();
    await page.getByRole("button", { name: /Tönnissen Erich GmbH/ }).click();
    await page.getByRole("combobox", { name: "Fahrer auswählen" }).click();
    await page.getByRole("option", { name: "Mechthild Gudel" }).click();
    await page.waitForTimeout(200);
    await page.locator("#fahrt-datum").fill("2026-07-06");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Gespeichert.")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(REFRESH_WARTEZEIT);

    await expect(
      page.getByRole("button", { name: /06\.07\.2026.*Mechthild Gudel — 7 Stopps/s })
    ).toBeVisible({ timeout: 10000 });
  });

  test("Touren-Liste zeigt weiterhin den Datums-Fallback (keine Distanz/Fahrzeit-Anzeige), solange keine Route berechnet ist", async ({
    page,
  }) => {
    await login(page);
    await oeffneMechthild0607(page);

    // PROJ-42 AC "Anzeige in der Touren-Liste": ohne (oder mit fehlgeschlagener)
    // Routenberechnung bleibt die bisherige Datums-/Anlage-Reihenfolge ohne
    // Distanz-/Fahrzeit-Anzeige — aktueller Live-Zustand, da noch kein
    // Backfill/GEOAPIFY_API_KEY konfiguriert ist.
    const tourKopf = page.getByRole("button", { name: /06\.07\.2026.*Mechthild Gudel/ });
    await expect(tourKopf).toBeVisible();
    await expect(tourKopf).not.toContainText("km");
    await expect(tourKopf).not.toContainText("Std.");
  });
});

test.describe("PROJ-42 QA-Fund BUG-1 (Fix-Verifikation) — Admin sieht Bearbeiten-Zugriff auf der Kundendetailseite", () => {
  test("Admin kann die 'Nächste Abholung'-Karte öffnen (Bearbeiten-Stift sichtbar, Dialog funktioniert)", async ({
    page,
  }) => {
    // Der Test-Account (playwright-test@tms.gudel-werkzeuge.de) hat die Rolle
    // admin (verifiziert: /verwaltung/abholungskalender ist ohne Redirect
    // erreichbar) — deckt damit den POSITIVEN Fall von BUG-1s Fix ab: Admins
    // dürfen weiterhin uneingeschränkt bearbeiten. Der NEGATIVE Fall (Nutzer
    // ohne Admin-Rolle wird abgelehnt) ist bewusst nur unit-getestet
    // (pickup-tours.test.ts) — es existiert kein zweiter Test-Account mit
    // anderer Rolle, und einen neuen Produktions-Account dafür anzulegen war
    // nicht Teil dieses QA-Laufs.
    await login(page);
    await page.goto("/kunden/c8fa7118-8445-45d7-a05a-3ca87669d041");
    await page.getByRole("tab", { name: /Logistik/ }).click();

    const stift = page.locator('button[title="Bearbeiten"].text-muted-foreground');
    await expect(stift).toBeVisible({ timeout: 10000 });
    await stift.click();

    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible();

    // Nur öffnen/schließen, nichts speichern — Live-Daten bleiben unverändert.
    await page.getByRole("button", { name: "Abbrechen" }).click();
  });
});
