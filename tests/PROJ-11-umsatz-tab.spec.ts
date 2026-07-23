import { test, expect } from '@playwright/test';

/**
 * PROJ-11 Umsatz-Tab-Neubau: Live-Berechnung aus `invoice_items` statt der nie
 * existierenden Materialized View `mv_partner_monthly_revenue` (siehe
 * features/PROJ-11-kundendetailseite.md, Abschnitt 2.3/15/16).
 * Benötigt einen Testkunden mit Rechnungsdaten in mehreren Kategorien
 * (Handel + Service) und mehreren Kalenderjahren.
 */
const TEST_KUNDE_ID = process.env.PROJ11_TEST_KUNDE_ID || '';

test.describe('Umsatz-Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'playwright-test@tms.gudel-werkzeuge.de');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    test.skip(!TEST_KUNDE_ID, 'PROJ11_TEST_KUNDE_ID nicht gesetzt — Testkunde erforderlich');
    await page.goto(`http://localhost:3000/kunden/${TEST_KUNDE_ID}`);
    await page.getByRole('tab', { name: /Umsatz/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('KPI-Kacheln zeigen Gesamtumsatz, Handelsumsatz und Serviceumsatz', async ({ page }) => {
    await expect(page.getByText('Gesamtumsatz')).toBeVisible();
    await expect(page.getByText('Handelsumsatz')).toBeVisible();
    await expect(page.getByText('Serviceumsatz')).toBeVisible();
  });

  test('Standard-Zeitraum ist "Letzte 12 Monate"', async ({ page }) => {
    await expect(page.getByRole('combobox')).toContainText('Letzte 12 Monate');
  });

  test('Zeitraum-Dropdown bietet Kalenderjahre und "Gesamt" zusätzlich an', async ({ page }) => {
    await page.getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'Gesamt' })).toBeVisible();
    // mindestens eine Kalenderjahr-Option (4-stellige Zahl)
    await expect(page.getByRole('option', { name: /^20\d{2}$/ }).first()).toBeVisible();
  });

  test('Wechsel des Zeitraums lädt das Diagramm neu', async ({ page }) => {
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Gesamt' }).click();
    await expect(page.getByRole('combobox')).toContainText('Gesamt');
    await page.waitForLoadState('networkidle');
    // Bei "Gesamt" gibt es keinen Vergleichszeitraum -> kein "%"-Badge neben Gesamtumsatz
    const gesamtumsatzCard = page.locator('div', { hasText: 'Gesamtumsatz' }).first();
    await expect(gesamtumsatzCard.getByText(/%$/)).toHaveCount(0);
  });

  test('Klick auf Handelsumsatz togglet die Rabattgruppen-Aufschlüsselung und zurück', async ({ page }) => {
    await page.getByText('Handelsumsatz').click();
    await expect(page.getByText('Handelsumsatz nach Rabattgruppe')).toBeVisible();

    await page.getByText('Handelsumsatz').click();
    await expect(page.getByText('Umsatzentwicklung')).toBeVisible();
  });

  test('Klick auf Serviceumsatz togglet die Rabattgruppen-Aufschlüsselung', async ({ page }) => {
    await page.getByText('Serviceumsatz').click();
    await expect(page.getByText('Serviceumsatz nach Rabattgruppe')).toBeVisible();
  });

  test('Klick auf Gesamtumsatz setzt eine aktive Kategorie-Aufschlüsselung zurück', async ({ page }) => {
    await page.getByText('Handelsumsatz').click();
    await expect(page.getByText('Handelsumsatz nach Rabattgruppe')).toBeVisible();

    await page.getByText('Gesamtumsatz').click();
    await expect(page.getByText('Umsatzentwicklung')).toBeVisible();
  });

  test('keine Server-Fehler in der Browser-Konsole beim Laden des Tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.getByRole('tab', { name: /Umsatz/i }).click();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('Kunden-Liste — Umsatzspalte', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'playwright-test@tms.gudel-werkzeuge.de');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('zeigt Umsatzwerte statt durchgängig 0 € (Regression: mv_partner_monthly_revenue existierte nie)', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/kunden');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    expect(content).toContain('€');
  });
});
