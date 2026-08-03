import { test, expect } from "@playwright/test";

/**
 * PROJ-43 — Globale Kundensuche + Umsatz-Caching
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden). Nutzt reale,
 * bereits vorhandene Kunden (z. B. "Mann & Tellschow Maschinen-Vertriebs-
 * GmbH" als umsatzstärksten Kunden, Kundennummer 60002) — keine Testdaten
 * werden angelegt oder verändert, alle Tests sind rein lesend.
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

function suchfeld(page: import("@playwright/test").Page) {
  // Eigenes Label seit dem BUG-2-Fix (vormals identisch zur bestehenden
  // Listen-Suche "Kunde suchen" auf /kunden — siehe QA-Bericht).
  return page.getByLabel("Kunden durchsuchen");
}

test.describe("PROJ-43 Sichtbarkeit & Zugriff", () => {
  test("Suchfeld ist im Header auf verschiedenen Seiten sichtbar", async ({ page }) => {
    await login(page);
    for (const path of ["/home", "/kunden", "/fahrer"]) {
      await page.goto(path);
      await expect(suchfeld(page)).toBeVisible();
    }
  });

  test("bleibt auf einem schmalen Bildschirm (375px) als volles Eingabefeld sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto("/home");
    const input = suchfeld(page);
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
  });
});

test.describe("PROJ-43 Sucheingabe & Treffer", () => {
  test("weniger als 2 Zeichen zeigen kein Dropdown", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("a");
    await page.waitForTimeout(400);
    await expect(page.locator('button:has(p.truncate)')).toHaveCount(0);
    await expect(page.getByText("Keine Kunden gefunden")).toHaveCount(0);
  });

  test("2+ Zeichen lösen nach kurzer Verzögerung eine Suche aus", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("er");
    await expect(page.locator('button:has(p.truncate)').first()).toBeVisible({ timeout: 2000 });
  });

  test("eine rein numerische Eingabe findet den Kunden über seine Kundennummer", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("60002");
    const treffer = page.locator('button:has(p.truncate)').first();
    await expect(treffer).toBeVisible({ timeout: 2000 });
    await expect(treffer).toContainText("Mann & Tellschow");
  });

  test("zeigt maximal 8 Treffer bei einer generischen Eingabe", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("er");
    await page.waitForTimeout(600);
    expect(await page.locator('button:has(p.truncate)').count()).toBeLessThanOrEqual(8);
  });

  test("ein Treffer zeigt Name/Firma, Ort und Umsatz", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("60002");
    const treffer = page.locator('button:has(p.truncate)').first();
    await expect(treffer).toBeVisible({ timeout: 2000 });
    await expect(treffer).toContainText("Mann & Tellschow");
    await expect(treffer).toContainText("Alsdorf");
    await expect(treffer.locator("span")).toContainText("€");
  });

  test("keine Treffer zeigen 'Keine Kunden gefunden' statt eines leeren Dropdowns", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("zzznonexistentcustomerxyz123");
    await expect(page.getByText("Keine Kunden gefunden")).toBeVisible({ timeout: 2000 });
  });

  test("ein Klick auf einen Treffer navigiert zur Kundendetailseite", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    await suchfeld(page).fill("60002");
    const treffer = page.locator('button:has(p.truncate)').first();
    await expect(treffer).toBeVisible({ timeout: 2000 });
    await treffer.click();
    await page.waitForURL(/\/kunden\/[0-9a-f-]+/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Mann & Tellschow/ })).toBeVisible();
  });
});

test.describe("PROJ-43 Umsatz-Konsistenz", () => {
  test("Liste, Suche und Umsatz-Tab zeigen denselben Umsatz-Wert für denselben Kunden", async ({ page }) => {
    await login(page);

    await page.goto("/kunden");
    await page.waitForSelector("table");
    const listeUmsatz = (await page.locator("tbody tr").first().locator("td").last().innerText()).trim();
    const listeLink = await page.locator("tbody tr").first().locator("a").first().getAttribute("href");
    const partnerId = listeLink!.split("/").pop();

    await page.goto("/home");
    await suchfeld(page).fill("60002");
    const treffer = page.locator('button:has(p.truncate)').first();
    await expect(treffer).toBeVisible({ timeout: 2000 });
    await expect(treffer).toContainText(listeUmsatz);

    await page.goto(`/kunden/${partnerId}`);
    await page.getByRole("tab", { name: "Umsatz" }).click();
    await expect(page.getByText("Gesamtumsatz")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(listeUmsatz)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("PROJ-43 Edge Cases", () => {
  test("Sonderzeichen %/_ (ILIKE-Wildcards) lösen keinen Fehler aus", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    for (const payload of ["100%", "a_b", "%%%%"]) {
      const input = suchfeld(page);
      await input.fill("");
      await input.fill(payload);
      await page.waitForTimeout(400);
      await expect(page.getByText("Suche fehlgeschlagen")).toHaveCount(0);
    }
  });

  test("nur die zuletzt gestartete Suchanfrage darf das Dropdown befüllen (Race-Schutz)", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    const input = suchfeld(page);
    await input.fill("M");
    await input.fill("Ma");
    await input.fill("Man");
    await input.fill("60002"); // letzte Eingabe: eindeutiger numerischer Treffer
    const treffer = page.locator('button:has(p.truncate)').first();
    await expect(treffer).toBeVisible({ timeout: 2000 });
    await expect(treffer).toContainText("Mann & Tellschow");
    await expect(page.locator('button:has(p.truncate)')).toHaveCount(1);
  });
});

test.describe("PROJ-43 Security", () => {
  test("ein XSS-Payload im Suchfeld wird nicht ausgeführt", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    let dialogTriggered = false;
    page.on("dialog", () => { dialogTriggered = true; });
    await suchfeld(page).fill('<img src=x onerror="window.__xss=1">');
    await page.waitForTimeout(500);
    const xss = await page.evaluate(() => (window as any).__xss === 1);
    expect(xss).toBe(false);
    expect(dialogTriggered).toBe(false);
  });

  test("Zugriff ohne Session leitet zu /login um", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/home");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("REGRESSION BUG-1: eine Suchanfrage mit eingeschleuster Filter-Bedingung darf keine fremden Treffer liefern", async ({ page }) => {
    await login(page);
    await page.goto("/home");
    // PostgREST-.or()-Injection: ohne Escaping/Quoting würde das Komma aus
    // der ilike-Bedingung ausbrechen und "display_name.neq." anhängen, was
    // für praktisch jede Zeile wahr ist. Seit dem BUG-1-Fix escaped/quotiert
    // escapeOrFilterValue (orders-helpers.ts) den Wert in allen drei
    // .or()-Aufrufen von partners.ts — dieser Test bewacht die Regression.
    await suchfeld(page).fill("zzznomatch99999,display_name.neq.");
    await page.waitForTimeout(600);
    await expect(page.getByText("Keine Kunden gefunden")).toBeVisible({ timeout: 2000 });
    await expect(page.locator('button:has(p.truncate)')).toHaveCount(0);
  });
});
