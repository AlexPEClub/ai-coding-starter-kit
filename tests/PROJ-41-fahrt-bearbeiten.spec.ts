import { test, expect } from "@playwright/test";

/**
 * PROJ-41 — Fahrer: Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf)
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden). Nutzt eine
 * bekannte, echte Tour (Mechthild Gudel, 06.07.2026, 7 Stopps) und setzt am
 * Ende jeder Änderung den Ursprungszustand zurück, damit die Live-Daten
 * unverändert bleiben. Nach jedem Speichern wird kurz gewartet, da
 * `router.refresh()` nicht synchron ist (die Datenbank ist sofort korrekt,
 * die UI zieht kurz danach nach).
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

test.describe("PROJ-41 Fahrt bearbeiten", () => {
  test("Klick auf einen Stopp öffnet den Dialog mit vorausgefüllten Werten", async ({ page }) => {
    await login(page);
    await oeffneMechthild0607(page);

    await page.getByRole("button", { name: /Rhehag GmbH/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Rhehag GmbH")).toBeVisible();
    await expect(page.getByLabel("Notiz")).toHaveValue("");
  });

  test("Abbrechen schließt den Dialog ohne zu speichern", async ({ page }) => {
    await login(page);
    await oeffneMechthild0607(page);

    await page.getByRole("button", { name: /Rhehag GmbH/ }).click();
    await page.getByLabel("Notiz").fill("Wird nie gespeichert");
    await page.getByRole("button", { name: "Abbrechen" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: /Rhehag GmbH/ }).click();
    await expect(page.getByLabel("Notiz")).toHaveValue("");
  });

  test("Speichern mit leerem Datum zeigt Validierungsfehler", async ({ page }) => {
    await login(page);
    await oeffneMechthild0607(page);

    await page.getByRole("button", { name: /Rhehag GmbH/ }).click();
    await page.locator("#fahrt-datum").fill("");
    await page.getByRole("button", { name: "Speichern" }).click();

    await expect(page.getByText("Bitte ein Datum auswählen.")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Speichern ohne Fahrer (bei zuvor unzugewiesenem Stopp) zeigt Validierungsfehler", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Kein Fahrer zugewiesen" }).click();

    // Bekannter, echter Stopp ohne zugewiesenen Fahrer (Status "geplant" in
    // der DB, Datum 23.04.2026) — Touren-Gruppe aufklappen, dann den Stopp öffnen.
    await page.getByRole("button", { name: /23\.04\.2026.*Kein Fahrer zugewiesen/s }).click();
    await page.getByRole("button", { name: /Gallhoff e\.K\./ }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Fahrer auswählen" })).toHaveText("Fahrer auswählen");

    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Bitte einen Fahrer auswählen.")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Notiz ändern speichert, zeigt Verlauf-Eintrag, lässt sich zurücksetzen", async ({ page }) => {
    await login(page);
    await oeffneMechthild0607(page);

    const stopButton = page.getByRole("button", { name: /Rhehag GmbH/ });
    await stopButton.click();
    await expect(page.getByText("Lädt…")).not.toBeVisible({ timeout: 15000 }); // Verlauf lädt asynchron beim Öffnen
    const verlaufVorher = await page.getByText(/hat am .* Notiz geändert/).count();

    await page.getByLabel("Notiz").fill("[E2E-Test] Kunde erst nach 14 Uhr erreichbar");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Gespeichert.")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(REFRESH_WARTEZEIT);

    await stopButton.click();
    await expect(page.getByLabel("Notiz")).toHaveValue("[E2E-Test] Kunde erst nach 14 Uhr erreichbar");
    await expect(page.getByText(/hat am .* Notiz geändert/)).toHaveCount(verlaufVorher + 1, { timeout: 10000 });

    // Zurücksetzen, damit die Live-Daten unverändert bleiben.
    await page.getByLabel("Notiz").fill("");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Gespeichert.")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(REFRESH_WARTEZEIT);

    await stopButton.click();
    await expect(page.getByLabel("Notiz")).toHaveValue("");
    await expect(page.getByText(/hat am .* Notiz geändert/)).toHaveCount(verlaufVorher + 2, { timeout: 10000 });
  });

  test("Fahrer und Datum ändern verschiebt den Stopp in die neue Tourengruppe, lässt sich zurücksetzen", async ({
    page,
  }) => {
    await login(page);
    await oeffneMechthild0607(page);

    await page.getByRole("button", { name: /Tönnissen Erich GmbH/ }).click();
    await page.getByRole("combobox", { name: "Fahrer auswählen" }).click();
    await page.getByRole("option", { name: "Christian Gudel" }).click();
    await page.waitForTimeout(200);
    await page.locator("#fahrt-datum").fill("2026-07-08");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Gespeichert.")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(REFRESH_WARTEZEIT);

    await expect(
      page.getByRole("button", { name: /08\.07\.2026.*Christian Gudel/s })
    ).toBeVisible({ timeout: 10000 });

    // Zurücksetzen, damit die Live-Daten unverändert bleiben.
    await page.getByRole("button", { name: /08\.07\.2026.*Christian Gudel/s }).click();
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
});
