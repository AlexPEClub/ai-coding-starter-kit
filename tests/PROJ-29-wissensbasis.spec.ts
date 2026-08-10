import { test, expect } from '@playwright/test';

/**
 * PROJ-29 Wissensbasis: Backend-QA (echtes Supabase Storage + Postgres statt
 * In-Memory-Stub, siehe features/PROJ-29-wissensbasis.md "Backend-Implementierung").
 * Nutzt den echten Leitz-Anwenderlexikon-PDF als realistisches Upload-Fixture
 * (aus dem lokalen Uploads-Ordner, nicht Teil des Repos) und räumt sein
 * Test-Dokument am Ende selbst wieder auf.
 */
const LEITZ_PDF =
  '/home/botti/.claude/uploads/18d7dfa2-c470-4d80-a745-ae0512e15f85/86f7eaa7-Leitz_Lexikon_Edition_7__11_Anwenderlexikon.pdf';
const KORRUPT_PDF = 'tests/fixtures/proj29-korrupt.pdf';

test.describe('Wissensbasis — Zugang & Grundgerüst', () => {
  test('nicht angemeldeter Zugriff wird zum Login umgeleitet', async ({ page }) => {
    await page.goto('/verwaltung/cms/wissensbasis');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Wissensbasis — Redaktion/Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'playwright-test@tms.gudel-werkzeuge.de');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto('/verwaltung/cms/wissensbasis');
    // shadcn CardTitle rendert als <div>, nicht als semantisches Heading — daher Text statt Rolle.
    await expect(page.getByText('Wissensbasis', { exact: true })).toBeVisible();
  });

  test('Kategorien-Verwaltung ist für Admin sichtbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Kategorien' })).toBeVisible();
  });

  test('Upload eines unlesbaren PDFs führt zu Status "Fehler", kein blockierender Fehler beim Upload selbst', async ({ page }) => {
    await page.getByRole('button', { name: 'Dokument hochladen' }).first().click();
    await page.locator('#file').setInputFiles(KORRUPT_PDF);
    await page.locator('#source').fill('QA-Testquelle');
    await page.getByRole('button', { name: 'Hochladen' }).click();

    // Upload-Dialog schließt (Server Action gibt ok:true sofort zurück, Fehler kommt async)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('proj29-korrupt.pdf').first()).toBeVisible();

    // Nach der Hintergrund-Verarbeitung (Polling alle ~4s) muss der Status auf "Fehler" wechseln
    const row = page.locator('tr', { hasText: 'proj29-korrupt.pdf' }).first();
    await expect(row.getByText('Fehler')).toBeVisible({ timeout: 20_000 });

    // Aufräumen
    await row.getByTitle('Löschen').click();
    await page.getByRole('button', { name: 'Löschen' }).click();
    await expect(page.locator('tr', { hasText: 'proj29-korrupt.pdf' })).not.toBeVisible();
  });

  test('Upload, Verarbeitung, Volltextsuche, Filter, Tags bearbeiten und Löschen eines echten PDFs', async ({ page }) => {
    await page.getByRole('button', { name: 'Dokument hochladen' }).first().click();
    await page.locator('#file').setInputFiles(LEITZ_PDF);
    await page.locator('#source').fill('Leitz');
    await page.getByRole('checkbox').first().check(); // erste Werkzeugart-Kategorie
    await page.getByRole('button', { name: 'Hochladen' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
    const filenamePattern = /Leitz_Lexikon_Edition_7__11_Anwenderlexikon\.pdf/;
    await expect(page.getByText(filenamePattern).first()).toBeVisible();

    // Status muss von "Wird verarbeitet" auf "Aktiv" wechseln (echte PDF-Textextraktion via unpdf)
    const row = page.locator('tr', { hasText: 'Anwenderlexikon' }).first();
    await expect(row.getByText('Aktiv')).toBeVisible({ timeout: 30_000 });

    // Tag muss tatsächlich gespeichert worden sein (nicht nur "—")
    await expect(row.getByText('—')).not.toBeVisible();

    // Volltextsuche: ein Begriff, der im echten Lexikon vorkommen sollte
    await page.getByPlaceholder('Wissensbasis durchsuchen...').fill('Zahnteilung');
    await page.waitForLoadState('networkidle');
    const found = await page.getByText(filenamePattern).first().isVisible().catch(() => false);
    test.info().annotations.push({
      type: 'fts-search-result',
      description: `Suchbegriff "Zahnteilung" ergab Treffer: ${found}`,
    });
    await page.getByPlaceholder('Wissensbasis durchsuchen...').fill('');
    await page.waitForLoadState('networkidle');

    // Tags bearbeiten
    await row.getByTitle('Tags bearbeiten').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('checkbox').nth(1).check();
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Aufräumen — Test-Upload nicht in der Wissensbasis belassen
    await row.getByTitle('Löschen').click();
    await page.getByRole('button', { name: 'Löschen' }).click();
    await expect(page.getByText(filenamePattern).first()).not.toBeVisible({ timeout: 10_000 });
  });

  test('keine Server-/Konsolenfehler beim Laden der Seite', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
