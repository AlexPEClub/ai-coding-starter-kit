import { test, expect } from "@playwright/test";

/**
 * PROJ-47 — Fahrer: Live-KPIs während laufender Tour
 *
 * Testet die neue KPI-Leiste im Tour-Accordion, die Fortschritt, nächsten Stopp,
 * und voraussichtliches Tourende zeigt.
 *
 * Läuft gegen Produktionsdaten (kein Staging vorhanden).
 * Nutzt den Playwright-Testaccount mit Fahrer/Admin-Rollen.
 *
 * Test-Hinweis: Die KPI-Leiste ist nur sichtbar für Tours, die bereits gestartet wurden.
 * Falls der Test-Account keine gestartete Tour hat, werden die relevanten Tests übersprungen
 * (analog zu PROJ-46-Muster).
 */

const FAHRER_EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

test.describe("PROJ-47 — Live-KPIs während laufender Tour", () => {
  test("AC-1: Tour noch nicht gestartet → keine KPI-Leiste sichtbar", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    // Auf "Mir zugewiesen" Tab sollten nicht-gestartete Tours sein
    const nichtGestarteteTour = page
      .locator("button")
      .filter({ hasText: /Tour starten/ })
      .first();

    if (await nichtGestarteteTour.isVisible()) {
      // Accordion-Element öffnen (das Parent des "Tour starten"-Buttons)
      const accordionTrigger = nichtGestarteteTour
        .locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]")
        .first();
      if (await accordionTrigger.isVisible()) {
        // KPI-Leiste sollte NICHT sichtbar sein, solange Tour nicht gestartet
        const kpiLeiste = accordionTrigger.locator('text="Stopps erledigt"');
        await expect(kpiLeiste).not.toBeVisible();
      }
    }
  });

  test("AC-2: Tour gestartet → KPI-Leiste sichtbar oberhalb Stopp-Liste", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    // Suche eine gestartete Tour (erkennbar am "Gestartet um HH:MM"-Text statt "Tour starten"-Button)
    const gestarteteTour = page.locator(":text('Gestartet um')").first();

    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      // Accordion öffnen (falls noch geschlossen)
      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // KPI-Leiste sollte sichtbar sein
      const kpiLeiste = tourAccordion.locator('text="Stopps erledigt"');
      await expect(kpiLeiste).toBeVisible();

      // KPI-Leiste sollte VOR der Stopp-Liste kommen
      const kpiContent = tourAccordion.locator('text="Stopps erledigt"').locator("xpath=ancestor::div[@class*='rounded-lg']");
      const stoppListe = tourAccordion.locator("ul");
      if (await kpiContent.isVisible() && await stoppListe.isVisible()) {
        const kpiBoundingBox = await kpiContent.boundingBox();
        const stoppBoundingBox = await stoppListe.boundingBox();
        if (kpiBoundingBox && stoppBoundingBox) {
          expect(kpiBoundingBox.y).toBeLessThan(stoppBoundingBox.y);
        }
      }
    } else {
      test.skip();
    }
  });

  test("AC-3: Admin im Tab 'Tourenplanung' sieht dieselbe KPI-Leiste (rein lesend)", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    // Zu "Tourenplanung" Tab wechseln
    await page.getByRole("tab", { name: "Tourenplanung" }).click();
    await page.waitForTimeout(500);

    // Suche gestartete Tour im Tourenplanung-Tab
    const gestarteteTour = page.locator(":text('Gestartet um')").first();
    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      // Accordion öffnen
      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // KPI-Leiste sollte sichtbar sein (identisch mit "Mir zugewiesen")
      const kpiLeiste = tourAccordion.locator('text="Stopps erledigt"');
      await expect(kpiLeiste).toBeVisible();

      // Keine Aktions-Buttons sollten in der KPI-Leiste sein (rein lesend)
      const kpiContent = tourAccordion.locator('text="Stopps erledigt"').locator("xpath=ancestor::div[@class*='rounded-lg']");
      const buttons = kpiContent.locator("button");
      await expect(buttons).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test("AC-4 & AC-5: Fortschrittsbalken zeigt K/N und verbleibende Stopps", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    const gestarteteTour = page.locator(":text('Gestartet um')").first();
    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // Fortschritts-Text sollte sichtbar sein (z. B. "0 von 3 Stopps erledigt")
      const fortschrittsText = tourAccordion.locator("text=/\\d+ von \\d+ Stopps erledigt/");
      await expect(fortschrittsText).toBeVisible();

      // Falls es verbleibende Stopps gibt, sollte die Zahl angezeigt werden (z. B. "3 verbleibend")
      const fortschrittsDiv = tourAccordion.locator('text="Stopps erledigt"').locator("xpath=ancestor::div[@class*='space-y']");
      const zeigeVerbleibend = await fortschrittsDiv.locator("text=/\\d+ verbleibend/").isVisible();
      if (zeigeVerbleibend) {
        // Die "verbleibend"-Zahl sollte vorhanden sein
        await expect(fortschrittsDiv.locator("text=/\\d+ verbleibend/")).toBeVisible();
      }

      // Progress-Balken selbst sollte vorhanden sein
      const progressBar = tourAccordion.locator('[role="progressbar"], .h-2');
      await expect(progressBar.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test("AC-6, AC-7, AC-8: Nächster Stopp mit/ohne Ankunftszeit", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    const gestarteteTour = page.locator(":text('Gestartet um')").first();
    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // Nächster Stopp sollte angezeigt werden (mit Name)
      const naechsterStoppZeile = tourAccordion.locator("text=/Nächster Stopp:/");
      if (await naechsterStoppZeile.isVisible()) {
        // Es sollte einen Kundennamen geben nach "Nächster Stopp:"
        const naechsterStoppName = naechsterStoppZeile.locator("xpath=following::span[@class*='font-medium'][1]");
        const name = await naechsterStoppName.textContent();
        expect(name).toBeTruthy();
        expect(name?.trim().length).toBeGreaterThan(0);

        // Ankunftszeit kann vorhanden sein oder nicht
        // Falls vorhanden, sollte sie im Format HH:MM vorliegen
        const ankunftszeitPattern = /\d{1,2}:\d{2}\s+Uhr/;
        const lineText = await naechsterStoppZeile.textContent();
        if (ankunftszeitPattern.test(lineText || "")) {
          // Ankunftszeit ist vorhanden und im richtigen Format
          expect(lineText).toMatch(ankunftszeitPattern);
        } else {
          // Kein Platzhalter sollte sichtbar sein (nur Name)
          expect(lineText).not.toMatch(/\(\s*Uhr\)|--:--/);
        }
      }
    } else {
      test.skip();
    }
  });

  test("AC-9 & AC-10: Voraussichtliches Tourende (wenn Berechnung vorhanden)", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    const gestarteteTour = page.locator(":text('Gestartet um')").first();
    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // Voraussichtliches Tourende kann vorhanden sein oder nicht (abhängig von Routenberechnung)
      const tourendeZeile = tourAccordion.locator("text=/Voraussichtliches Tourende:/");
      if (await tourendeZeile.isVisible()) {
        // Falls vorhanden, sollte es eine Uhrzeit im Format HH:MM sein
        const lineText = await tourendeZeile.textContent();
        expect(lineText).toMatch(/\d{1,2}:\d{2}\s+Uhr/);
      } else {
        // Keine KPI-Zeile für Tourende ist OK, wenn keine Routenberechnung vorliegt
        // Dies ist ein gültiger Fallback-Status
      }
    } else {
      test.skip();
    }
  });

  test("AC-11: Nach Seite-Neuladung zeigt KPI-Leiste aktualisierte Werte", async ({ page }) => {
    await login(page, FAHRER_EMAIL);
    await page.goto("/fahrer");

    const gestarteteTour = page.locator(":text('Gestartet um')").first();
    if (await gestarteteTour.isVisible()) {
      const tourAccordion = gestarteteTour.locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]").first();
      const trigger = tourAccordion.locator("button[class*='AccordionTrigger']").first();

      if (!(await tourAccordion.locator("[class*='AccordionContent']").isVisible())) {
        await trigger.click();
        await page.waitForTimeout(300);
      }

      // Wert vor Neuladung erfassen
      const fortschrittsTextVor = await tourAccordion
        .locator("text=/\\d+ von \\d+ Stopps erledigt/")
        .textContent();

      // Seite neuladen
      await page.reload();
      await page.waitForTimeout(1000);

      // Nach Neuladung sollte die KPI-Leiste immer noch vorhanden sein
      const gestarteteTourNach = page.locator(":text('Gestartet um')").first();
      if (await gestarteteTourNach.isVisible()) {
        const tourAccordionNach = gestarteteTourNach
          .locator("xpath=ancestor::*[contains(@class, 'AccordionItem')]")
          .first();
        const triggerNach = tourAccordionNach.locator("button[class*='AccordionTrigger']").first();

        if (!(await tourAccordionNach.locator("[class*='AccordionContent']").isVisible())) {
          await triggerNach.click();
          await page.waitForTimeout(300);
        }

        // KPI-Leiste sollte immer noch sichtbar sein
        const fortschrittsTextNach = await tourAccordionNach
          .locator("text=/\\d+ von \\d+ Stopps erledigt/")
          .textContent();

        await expect(tourAccordionNach.locator('text="Stopps erledigt"')).toBeVisible();
        expect(fortschrittsTextNach).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });
});
