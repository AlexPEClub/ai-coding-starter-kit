import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-6: Implementation Tracking & History
 *
 * Hinweis: Tests die das eingeloggte Dashboard mit echten Vorschlägen prüfen
 * (Als-umgesetzt-markieren, Verlauf-Tab, Filter, Zähler) benötigen gültige
 * Supabase-Credentials in .env.local, einen Test-Nutzer und Seed-Daten mit
 * Vorschlägen in verschiedenen Statuses. Sie sind mit test.skip markiert,
 * bis diese vorhanden sind.
 *
 * Die Auth-/Route-Schutz-Tests laufen ohne Credentials.
 */

test.describe('PROJ-6: Route-Schutz', () => {
  // Technical Requirement: Statuswechsel-UI nur für eingeloggte Nutzer
  test('leitet nicht eingeloggte Nutzer von /dashboard zur Login-Seite weiter', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })
})

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('#email').fill(process.env.E2E_TEST_EMAIL!)
  await page.locator('#password').fill(process.env.E2E_TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test.describe('PROJ-6: Tabs & Verlauf (eingeloggt)', () => {
  // AC: Dashboard zeigt Tabs "Vorschläge" und "Verlauf"
  test.skip('zeigt die Tabs Vorschläge und Verlauf', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('tab', { name: 'Vorschläge' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Verlauf' })).toBeVisible()
  })

  // AC: Verlauf zeigt alle Vorschläge aller Statuses sortiert nach Datum desc
  test.skip('zeigt im Verlauf-Tab Vorschläge aller Statuses', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Verlauf' }).click()
    // Mindestens ein Status-Badge muss sichtbar sein
    await expect(page.getByText(/Umgesetzt|Bestätigt|Abgelehnt|Offen/).first()).toBeVisible()
  })

  // AC: Zähler "Umgesetzt: X | Bestätigt: Y | Abgelehnt: Z"
  test.skip('zeigt die Zusammenfassungs-Zähler im Verlauf', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Verlauf' }).click()
    await expect(page.getByText(/umgesetzt/)).toBeVisible()
    await expect(page.getByText(/bestätigt/)).toBeVisible()
    await expect(page.getByText(/abgelehnt/)).toBeVisible()
  })

  // AC: Filter nach Status zeigt nur Vorschläge des gewählten Status
  test.skip('filtert den Verlauf nach Status', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Verlauf' }).click()
    const filterGroup = page.getByRole('group', { name: 'Nach Status filtern' })
    await filterGroup.getByRole('button', { name: 'Umgesetzt' }).click()
    // Aktiver Filter ist als gedrückt markiert
    await expect(filterGroup.getByRole('button', { name: 'Umgesetzt' })).toHaveAttribute('aria-pressed', 'true')
  })

  // AC: Leerer Zustand beim Filtern ohne Treffer
  test.skip('zeigt einen leeren Zustand wenn kein Vorschlag zum Filter passt', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Verlauf' }).click()
    const filterGroup = page.getByRole('group', { name: 'Nach Status filtern' })
    await filterGroup.getByRole('button', { name: 'Umgesetzt' }).click()
    // Wenn keine umgesetzten Vorschläge existieren, erscheint der Empty State
    const emptyState = page.getByText('Keine Einträge')
    if (await emptyState.isVisible()) {
      await expect(page.getByText(/Noch keine Vorschläge mit Status/)).toBeVisible()
    }
  })
})

test.describe('PROJ-6: Als umgesetzt markieren (eingeloggt)', () => {
  // AC: Button nur bei approved sichtbar; Klick → implemented + verschwindet
  test.skip('markiert einen bestätigten Vorschlag als umgesetzt', async ({ page }) => {
    await login(page)
    const implementButton = page.getByRole('button', { name: /als umgesetzt markieren/i }).first()
    await expect(implementButton).toBeVisible()
    const cardTitle = await implementButton
      .locator('xpath=ancestor::*[contains(@class,"relative")]//h3')
      .textContent()
    await implementButton.click()
    // Toast erscheint, Karte verschwindet aus der Hauptansicht
    await expect(page.getByText('Vorschlag als umgesetzt markiert')).toBeVisible({ timeout: 10000 })
    if (cardTitle) {
      await expect(page.getByRole('tabpanel').getByText(cardTitle, { exact: true })).toHaveCount(0)
    }
  })

  // AC: Kein Bestätigungsdialog vor der Markierung
  test.skip('zeigt keinen Bestätigungsdialog vor dem Markieren', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /als umgesetzt markieren/i }).first().click()
    // Direkt der Erfolgs-Toast — kein Dialog dazwischen
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Vorschlag als umgesetzt markiert')).toBeVisible({ timeout: 10000 })
  })

  // AC: Bei pending Vorschlägen ist der Button nicht sichtbar
  test.skip('zeigt den Umgesetzt-Button nicht bei offenen Vorschlägen', async ({ page }) => {
    await login(page)
    // Karte mit Bestätigen-Button (= pending) darf keinen Umgesetzt-Button enthalten
    const pendingCard = page
      .getByRole('button', { name: /Vorschlag bestätigen/ })
      .first()
      .locator('xpath=ancestor::*[contains(@class,"relative")]')
    await expect(pendingCard.getByRole('button', { name: /als umgesetzt markieren/i })).toHaveCount(0)
  })

  // Edge Case: Umgesetzter Vorschlag erscheint im Verlauf mit Status "Umgesetzt"
  test.skip('zeigt den umgesetzten Vorschlag im Verlauf', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /als umgesetzt markieren/i }).first().click()
    await expect(page.getByText('Vorschlag als umgesetzt markiert')).toBeVisible({ timeout: 10000 })
    await page.getByRole('tab', { name: 'Verlauf' }).click()
    await expect(page.getByText('Umgesetzt').first()).toBeVisible()
  })
})
