import { test, expect } from "@playwright/test";

/**
 * PROJ-34 — Werkzeug-/Auftrags-Fundament, Fahrer-Auftragserfassung & Wareneingang
 *
 * Deckt die UI-seitig sicher (ohne echten Druckauftrag / ohne Mutation an
 * echten Kundendaten) testbaren Akzeptanzkriterien ab. QR-Scan-Fälle
 * (erfordern eine echte Kamera) und die Kommissions-Pflicht-Logik sind
 * separat unit-getestet (werkzeug-auftraege-helpers.test.ts).
 */

const EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(EMAIL);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

// PROJ-21 (Fahrer-Seite) wurde entfernt und wird neu aufgebaut — der
// Feld-Auftrag-Einstieg (/fahrer-Rollen-Gate, QR-Druck-Button) ist bis dahin
// nicht erreichbar; die zugehörigen Tests entfallen so lange.
test.describe("PROJ-34 Rollen-Gate", () => {
  test("Admin/Wareneingang-Testaccount darf /wareneingang öffnen (nicht verweigert)", async ({ page }) => {
    await login(page);
    await page.goto("/wareneingang");
    await expect(page).not.toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "📦 Wareneingang" })).toBeVisible();
  });
});

test.describe("PROJ-34 QR-Codes drucken (UI, ohne echten Druckauftrag)", () => {
  test("Button ist auch auf /wareneingang sichtbar", async ({ page }) => {
    await login(page);
    await page.goto("/wareneingang");
    await expect(page.getByRole("button", { name: /QR-Codes drucken/ })).toBeVisible();
  });
});

test.describe("PROJ-34 Wareneingang — Auftrag hinzufügen", () => {
  test("Auftrag hinzufügen öffnet direkt den Scanner auf einem leeren Auftrag, Werkzeug ohne Code funktioniert End-to-End", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/wareneingang");

    await page.getByRole("button", { name: "Auftrag hinzufügen" }).click();

    // Kein Formular davor — direkt der Erfassungs-Dialog mit Scanner.
    await expect(page.getByText("Neuer Auftrag")).toBeVisible();
    const ohneCodeButton = page.getByRole("button", { name: "Werkzeug ohne Code vermerken" });
    await expect(ohneCodeButton).toBeVisible();

    // Kein Kunde vorausgewählt → manuelle Kunden-Suche als Fallback sichtbar.
    await expect(page.getByPlaceholder("Kunde suchen…")).toBeVisible();

    await ohneCodeButton.click();
    await expect(page.getByText("Werkzeug ohne Code — Zuordnung im Werk nachholen")).toBeVisible();
    await expect(page.getByText("Werkzeuge im Auftrag (1)")).toBeVisible();
  });
});

test.describe("PROJ-34 Kommissions-Einstellungen (Kunden-Detailseite)", () => {
  test("Karte wird im Logistik-Tab angezeigt", async ({ page }) => {
    await login(page);
    await page.goto("/kunden");
    const firstLink = page.locator('a[href^="/kunden/"]').first();
    await firstLink.click();
    await page.waitForLoadState("networkidle");
    const logistikTab = page.getByRole("tab", { name: /Logistik/ });
    if (await logistikTab.count() > 0) {
      await logistikTab.click();
    }
    await expect(page.getByText("Kommissions-Einstellungen")).toBeVisible();
    await expect(page.getByText("Kommission ist Pflicht")).toBeVisible();
  });
});
