import { test, expect } from '@playwright/test';

/**
 * PROJ-35 — Werkzeugkategorien & Pfade (Stammdaten). Läuft gegen die echte
 * Live-Datenbank (kein Staging vorhanden) — alle angelegten Testdaten
 * verwenden einen eindeutigen Lauf-Suffix, um Kollisionen mit parallel
 * laufenden Test-Läufen/Worktrees zu vermeiden.
 */
const RUN = Date.now().toString(36);

test.describe('Werkzeugkategorien — Zugang', () => {
  test('nicht angemeldeter Zugriff wird zum Login umgeleitet', async ({ page }) => {
    await page.goto('/verwaltung/werkzeugkategorien');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe.serial('Werkzeugkategorien — Admin-Verwaltung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'playwright-test@tms.gudel-werkzeuge.de');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto('/verwaltung/werkzeugkategorien');
    await expect(page.getByText('Werkzeugkategorien & Pfade', { exact: true })).toBeVisible();
  });

  test('Oberkategorie anlegen — erscheint sofort in der Liste', async ({ page }) => {
    const name = `QA-Ober-${RUN}`;
    await page.getByPlaceholder('Neue Oberkategorie').fill(name);
    await page.getByPlaceholder('Neue Oberkategorie').press('Enter');
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  });

  test('Doppelter Oberkategorie-Name wird abgelehnt', async ({ page }) => {
    const name = `QA-Ober-${RUN}`;
    await page.getByPlaceholder('Neue Oberkategorie').fill(name);
    await page.getByPlaceholder('Neue Oberkategorie').press('Enter');
    await expect(page.getByText(/existiert bereits/)).toBeVisible();
  });

  test('Unterkategorie anlegen unter der neuen Oberkategorie', async ({ page }) => {
    await page.getByText(`QA-Ober-${RUN}`, { exact: true }).click();
    const name = `QA-Unter-${RUN}`;
    await page.getByPlaceholder('Neue Unterkategorie').fill(name);
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();
    await expect(page.getByText('Preisstaffel fehlt')).toBeVisible();
  });

  test('Doppelter Unterkategorie-Name in derselben Oberkategorie wird abgelehnt', async ({ page }) => {
    await page.getByText(`QA-Ober-${RUN}`, { exact: true }).click();
    const name = `QA-Unter-${RUN}`;
    await page.getByPlaceholder('Neue Unterkategorie').fill(name);
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.getByText(/existiert bereits in dieser Oberkategorie/)).toBeVisible();
  });

  test('Geometrie-Parameter (Freitext) anlegen', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parameter-Register' }).click();
    await page.getByRole('button', { name: 'Neuer Parameter' }).click();
    await page.getByLabel('Name *').fill(`QA-Durchmesser-${RUN}`);
    await page.getByLabel('Einheit').fill('mm');
    await page.getByRole('button', { name: 'Anlegen' }).click();
    await expect(page.getByText(`QA-Durchmesser-${RUN}`)).toBeVisible();
  });

  test('Geometrie-Parameter (Dropdown) anlegen inkl. Wert hinzufügen', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parameter-Register' }).click();
    await page.getByRole('button', { name: 'Neuer Parameter' }).click();
    await page.getByLabel('Name *').fill(`QA-Zahnform-${RUN}`);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Dropdown' }).click();
    await page.getByLabel(/Dropdown-Werte/).fill('Wechselzahn, Flachzahn');
    await page.getByRole('button', { name: 'Anlegen' }).click();
    await expect(page.getByText('Wechselzahn')).toBeVisible();

    const row = page.locator('tr', { hasText: `QA-Zahnform-${RUN}` });
    await row.getByRole('button', { name: '+ Wert' }).click();
    await page.getByPlaceholder('z.B. Spitzzahn').fill('Trapezzahn');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(row.getByText('Trapezzahn')).toBeVisible();
  });

  test('Externen Dienstleister über volles Partner-Formular anlegen', async ({ page }) => {
    await page.getByRole('tab', { name: 'Dienstleister' }).click();
    await page.getByRole('button', { name: 'Neuer Dienstleister' }).click();
    await page.getByLabel('Firmenname *').fill(`QA-Dienstleister-${RUN} GmbH`);
    await page.getByLabel('Ansprechpartner').fill('Max Mustermann');
    await page.getByLabel('E-Mail').fill('kontakt@qa-dienstleister-test.de');
    await page.getByLabel('Ort').fill('Musterstadt');
    await page.getByRole('button', { name: 'Anlegen' }).click();
    await expect(page.getByText(`QA-Dienstleister-${RUN} GmbH`)).toBeVisible();
    await expect(page.getByText(/^L-\d{4}$/)).toBeVisible();
  });

  test('Pfad anlegen mit einem Schritt im Betrieb und einem Schritt extern', async ({ page }) => {
    await page.getByRole('tab', { name: 'Pfade' }).click();
    await page.getByRole('button', { name: 'Neuer Pfad' }).click();
    await page.getByPlaceholder('z.B. Standard-Schärfpfad').fill(`QA-Pfad-${RUN}`);
    await page.getByRole('button', { name: 'Anlegen' }).click();
    await page.getByText(`QA-Pfad-${RUN}`).click();

    // Schritt 1: im Betrieb
    await page.getByPlaceholder('z.B. Schärfen').fill('Schärfen');
    await page.getByRole('button', { name: 'Schritt speichern' }).click();
    await expect(page.getByText('Schärfen')).toBeVisible();
    await expect(page.getByText('Im Betrieb')).toBeVisible();

    // Schritt 2: extern, mit dem zuvor angelegten Dienstleister
    await page.getByPlaceholder('z.B. Schärfen').fill('Beschichten');
    await page.getByRole('combobox').filter({ hasText: 'Im Betrieb' }).click();
    await page.getByRole('option', { name: 'Extern' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Dienstleister wählen' }).click();
    await page.getByRole('option', { name: new RegExp(`QA-Dienstleister-${RUN}`) }).click();
    await page.getByRole('button', { name: 'Schritt speichern' }).click();
    await expect(page.getByText(new RegExp(`Extern: QA-Dienstleister-${RUN}`))).toBeVisible();
  });

  test('Pfad-Schritt ohne Dienstleister bei Ort=extern wird abgelehnt', async ({ page }) => {
    await page.getByRole('tab', { name: 'Pfade' }).click();
    await page.getByText(`QA-Pfad-${RUN}`).click();
    await page.getByPlaceholder('z.B. Schärfen').fill('Fehlerhafter Schritt');
    await page.getByRole('combobox').filter({ hasText: 'Im Betrieb' }).click();
    await page.getByRole('option', { name: 'Extern' }).click();
    await page.getByRole('button', { name: 'Schritt speichern' }).click();
    await expect(page.getByText(/muss ein Dienstleister ausgewählt werden/)).toBeVisible();
  });

  test('Unterkategorie: Parameter zuordnen, Preis-Parameter wählen, Standard-Pfad zuweisen', async ({ page }) => {
    await page.getByRole('tab', { name: 'Kategorien' }).click();
    await page.getByText(`QA-Ober-${RUN}`, { exact: true }).click();
    await page.getByRole('cell', { name: `QA-Unter-${RUN}` }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByText(`QA-Durchmesser-${RUN}`).click(); // Checkbox-Label anklicken

    const preisParamSelect = page.getByRole('combobox').filter({ hasText: /Parameter wählen/ });
    await preisParamSelect.click();
    await page.getByRole('option', { name: new RegExp(`QA-Durchmesser-${RUN}`) }).click();

    const pfadSelect = page.getByRole('combobox').filter({ hasText: 'Pfad wählen' });
    await pfadSelect.click();
    await page.getByRole('option', { name: `QA-Pfad-${RUN}` }).click();

    await expect(page.getByText(/Ohne mindestens eine vollständige Preisstufe/)).toBeVisible();
  });

  test('Preisstaffel: Kandidat ankreuzen, Bereich setzen, Einsatzbereit wird true', async ({ page }) => {
    await page.getByRole('tab', { name: 'Kategorien' }).click();
    await page.getByText(`QA-Ober-${RUN}`, { exact: true }).click();
    await page.getByRole('cell', { name: `QA-Unter-${RUN}` }).click();

    await page.getByRole('button', { name: 'Neuer Serviceartikel' }).click();
    await page.getByLabel('Nummer *').fill(`QA-ART-${RUN}`);
    await page.getByLabel('Bezeichnung *').fill(`QA Schärfen ${RUN}`);
    await page.getByLabel('Preis (€) *').fill('19.90');
    await page.getByRole('button', { name: 'Anlegen' }).click();

    await expect(page.getByText(`QA-ART-${RUN}`)).toBeVisible();
    await page.getByText(`QA-ART-${RUN}`).locator('..').getByRole('checkbox').check();

    await page.getByPlaceholder('Von').fill('1');
    await page.getByPlaceholder('offen').fill('20');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Bereich gespeichert.')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Einsatzbereit')).toBeVisible();
  });
});
