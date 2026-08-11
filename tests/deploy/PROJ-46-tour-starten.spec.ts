import { test, expect } from "@playwright/test";

/**
 * PROJ-46 — Fahrer: Tour starten (Status-Wechsel)
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden, gleiches
 * Muster wie PROJ-45). Prüft die sichtbaren UI-Elemente ohne tatsächliche
 * "Tour starten"-Aktion (würde echte Produktionsdaten mutieren).
 *
 * Tests:
 * 1. Tab "Mir zugewiesen" zeigt "Tour starten"-Button (falls Tour noch nicht gestartet)
 * 2. Bestätigungsdialog ist implementiert (AlertDialog struktury verfügbar)
 * 3. "Navi"- und "Erledigt"-Buttons sind deaktiviert wenn Tour nicht gestartet
 * 4. Admin-Sicht ("Tourenplanung") zeigt nur Text, kein Button
 */

const FAHRER_EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(FAHRER_EMAIL);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

test.describe("PROJ-46 Tour starten — Fahrer-Sicht, Button-Struktur, Dialog", () => {
  test("Tab 'Mir zugewiesen' zeigt Tour-starten-Button und Gating für Navi/Erledigt", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/fahrer");

    // Tab "Mir zugewiesen" ist default, aber explizit prüfen
    const mirZugewiesenTab = page.getByRole("tab", { name: /mir zugewiesen/i });
    await expect(mirZugewiesenTab).toBeVisible({ timeout: 10000 });
    if (!(await mirZugewiesenTab.evaluate((el) => (el as HTMLElement).getAttribute("aria-selected") === "true"))) {
      await mirZugewiesenTab.click();
    }

    // Der Playwright-Testaccount hat laut PROJ-21 aktuell 0 eigene offene Touren —
    // in diesem Fall zeigt die Seite korrekt "Keine offenen Touren." statt eines
    // Accordions. Der Rest dieses Tests (Button/Dialog/Gating) ist dann nicht
    // anwendbar und wird übersprungen, statt fälschlich als Fehler zu gelten.
    const leerZustand = page.getByText("Keine offenen Touren.");
    if (await leerZustand.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Testaccount hat aktuell keine eigenen offenen Touren — Button/Gating nicht prüfbar.");
      return;
    }

    // Mindestens einen Accordion-Header mit Tour-Informationen (Fahrer+Datum) und ggf. Button
    const accordionHeader = page.locator("div[role='region']").filter({ has: page.locator("button, [role='button']") }).first();
    await expect(accordionHeader).toBeVisible({ timeout: 10000 });

    // Prüfen: Entweder "Tour starten"-Button oder "Gestartet um HH:MM"-Text sollte sichtbar sein
    const tourStartenButton = page.getByRole("button", { name: /tour starten/i });
    const gestartetText = page.locator("text=/Gestartet um \\d{2}:\\d{2}/");

    const buttonVisible = await tourStartenButton.isVisible().catch(() => false);
    const textVisible = await gestartetText.isVisible().catch(() => false);

    expect(
      buttonVisible || textVisible,
      "Weder 'Tour starten'-Button noch 'Gestartet um HH:MM'-Text gefunden"
    ).toBe(true);

    // Falls Button sichtbar: Klick-Test (aber KEIN Bestätigen, um Daten zu schützen)
    if (buttonVisible) {
      await tourStartenButton.first().click();

      // AlertDialog sollte sich öffnen
      const dialog = page.locator("[role='alertdialog']");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog hat Beschreibungstext
      const dialogText = dialog.locator("text=/Tour wirklich starten/i, text=/bestätigen/i");
      await expect(dialogText.first()).toBeVisible();

      // Abbrechen — wir starten nicht wirklich, um Produktionsdaten zu schützen
      const cancelButton = dialog.getByRole("button", { name: /abbrechen|nein|schließen/i }).first();
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Dialog sollte sich schließen
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }

    // Öffne einen Stopp (StoppDetailModal) und prüfe Gating:
    // Falls Tour noch nicht gestartet, sollten "Navi"- und "Erledigt"-Buttons deaktiviert sein
    const firstStoppButton = page.locator("button").filter({ has: page.locator("text=/fahrer|stopp/i") }).first();
    if (await firstStoppButton.isVisible().catch(() => false)) {
      await firstStoppButton.click();

      const modal = page.locator("[role='dialog']");
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Suche nach "Navi"- und "Erledigt"-Buttons
      const naviButton = modal.getByRole("button", { name: /navi|navigation/i });
      const erledigt_button = modal.getByRole("button", { name: /erledigt|abschließen|fertig/i });

      // Wenn die Tour noch nicht gestartet ist, sollten diese deaktiviert sein
      if (!textVisible) {
        // Tour nicht gestartet → Buttons sollten deaktiviert sein
        if (await naviButton.isVisible().catch(() => false)) {
          const isDisabled = await naviButton.evaluate((el) => (el as HTMLButtonElement).disabled);
          expect(isDisabled).toBe(true);
        }
        if (await erledigt_button.isVisible().catch(() => false)) {
          const isDisabled = await erledigt_button.evaluate((el) => (el as HTMLButtonElement).disabled);
          expect(isDisabled).toBe(true);
        }
      }

      // Modal schließen
      const closeButton = modal.getByRole("button", { name: /schließen|✕|×/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }
  });

  test("Admin-Sicht 'Tourenplanung' zeigt nur Text, kein Button", async ({ page }) => {
    await login(page);
    await page.goto("/fahrer");

    // Zu "Tourenplanung"-Tab wechseln
    const tourenplanungTab = page.getByRole("tab", { name: /tourenplanung/i });
    await expect(tourenplanungTab).toBeVisible({ timeout: 10000 });
    await tourenplanungTab.click();

    // In diesem Tab sollte es keinen "Tour starten"-Button geben
    // (nur Admin, der nicht selbst starten darf)
    const tourStartenButton = page.getByRole("button", { name: /tour starten/i });
    const tourStartenButtonVisible = await tourStartenButton.isVisible().catch(() => false);

    expect(tourStartenButtonVisible, "Tour starten'-Button sollte im Admin-Tab nicht sichtbar sein").toBe(false);

    // Aber evtl. der "Gestartet um"-Text (wenn Touren bereits gestartet wurden)
    // Das ist optional, daher nicht erzwingt
  });
});
