import { test, expect } from "@playwright/test";

/**
 * PROJ-21 — Fahrer: Tourenliste (nur Anzeige)
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden). Nutzt den
 * Playwright-Testaccount (Rollen: alle, u.a. fahrer+admin, aktuell 0 eigene
 * offene Touren) sowie einen rollenlosen QA-Account (nur "werker") für den
 * Zugriffsschutz-Test. Es werden keine Daten verändert.
 */

const FAHRER_EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const NOROLE_EMAIL = "qa-proj29-norole@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

test.describe("PROJ-21 Zugang & Rollen", () => {
  test("Nutzer ohne Rolle fahrer/admin wird von /fahrer auf /dashboard umgeleitet", async ({ page }) => {
    await login(page, NOROLE_EMAIL);
    await page.goto("/fahrer");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Nutzer mit Rolle fahrer/admin sieht beide Tabs auf /fahrer", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await expect(page).toHaveURL(/\/fahrer/);
    await expect(page.getByRole("tab", { name: "Mir zugewiesen" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tourenplanung" })).toBeVisible();
  });
});

test.describe("PROJ-21 Tab Mir zugewiesen", () => {
  test("Leerzustand wird angezeigt, wenn der Fahrer keine offenen Touren hat", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    // Tab "Mir zugewiesen" ist per defaultValue bereits aktiv.
    await expect(page.getByText("Keine offenen Touren.")).toBeVisible();
  });
});

test.describe("PROJ-21 Tab Tourenplanung", () => {
  test("zeigt offene Touren aller Fahrer inkl. Fahrername und Stopp-Anzahl", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    // Bekannte offene Mehrfach-Stopp-Tour aus Produktivdaten (Mechthild Gudel, 2026-07-06, 7 Stopps).
    const tourZeile = page.getByRole("button", { name: /06\.07\.2026.*Mechthild Gudel — 7 Stopps/s });
    await expect(tourZeile).toBeVisible();
  });

  test("Tour aufklappen zeigt Firma, Adresse und Status-Badge je Stopp", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    await page.getByRole("button", { name: /06\.07\.2026.*Mechthild Gudel — 7 Stopps/s }).click();

    await expect(page.getByText("Rhehag GmbH")).toBeVisible();
    await expect(page.getByText("Tönnissen Erich GmbH")).toBeVisible();
    await expect(page.getByText("Verfürth GmbH Schreinereibedarf - Grosshandlung")).toBeVisible();
    // Datum (06.07.2026) liegt vor "heute" — Status "geplant" wird deshalb als
    // "Überfällig" (nicht "Geplant") angezeigt, siehe berechneFahrtBadge().
    await expect(page.getByText("Überfällig").first()).toBeVisible();
  });

  test("Filter nach Fahrer schränkt die Liste ein", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Mechthild Gudel" }).click();

    await expect(page.getByText(/Mechthild Gudel/).first()).toBeVisible();
    await expect(page.getByText(/Christian Gudel/)).toHaveCount(0);
  });

  test("Filter nach Fahrer+Datum ohne Treffer zeigt Leerzustand", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Mechthild Gudel" }).click();
    await page.getByLabel("Datum filtern").fill("2099-01-01");

    await expect(page.getByText("Keine Touren für diese Auswahl.")).toBeVisible();
  });

  test("Fahrten ohne zugewiesenen Fahrer werden mit Hinweis angezeigt", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Kein Fahrer zugewiesen" }).click();

    await expect(page.getByText(/Kein Fahrer zugewiesen — /).first()).toBeVisible();
  });
});
