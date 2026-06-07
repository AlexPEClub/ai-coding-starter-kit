import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-3: Review & Approval Dashboard
 *
 * Hinweis: Tests die das eingeloggte Dashboard mit echten Vorschlägen prüfen
 * (Anzeige, Bestätigen/Ablehnen, Rückgängig, Empty State) benötigen gültige
 * Supabase-Credentials in .env.local, einen angelegten Test-Nutzer und
 * Seed-Daten in der `suggestions`-Tabelle. Sie sind mit test.skip markiert,
 * bis diese vorhanden sind.
 *
 * Die Auth-/Route-Schutz-Tests laufen ohne Credentials, da die Middleware
 * nicht eingeloggte Nutzer direkt zur Login-Seite leitet.
 */

test.describe('PROJ-3: Route-Schutz', () => {
  // AC: Nicht eingeloggt → Weiterleitung zur Login-Seite
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

test.describe('PROJ-3: Dashboard (eingeloggt)', () => {
  // AC: Dashboard zeigt Branding-Header
  test.skip('zeigt den Nexora AI Header mit NORA-Badge', async ({ page }) => {
    await login(page)
    await expect(page.getByText('NEXORA AI')).toBeVisible()
    await expect(page.getByText('NORA')).toBeVisible()
  })

  // AC: Zähler offen/bestätigt/abgelehnt sichtbar
  test.skip('zeigt den Statistik-Zähler offen · bestätigt · abgelehnt', async ({ page }) => {
    await login(page)
    await expect(page.getByText(/offen/)).toBeVisible()
    await expect(page.getByText(/bestätigt/)).toBeVisible()
    await expect(page.getByText(/abgelehnt/)).toBeVisible()
  })

  // AC: Vorschläge nach Kategorie gruppiert
  test.skip('gruppiert Vorschläge nach Kategorie (Marketing, Produkt, Operations)', async ({ page }) => {
    await login(page)
    // Mindestens eine Kategorie-Überschrift muss sichtbar sein
    await expect(
      page.getByRole('heading', { name: /Marketing|Produkt|Operations/ }).first()
    ).toBeVisible()
  })

  // AC: Karte zeigt Bestätigen + Ablehnen Buttons
  test.skip('zeigt Bestätigen- und Ablehnen-Buttons auf jeder Karte', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Vorschlag ablehnen/ }).first()).toBeVisible()
  })

  // AC: Details aufklappbar (Insight + Source)
  test.skip('klappt Details (Insight + Quelle) beim Klick auf', async ({ page }) => {
    await login(page)
    const detailsTrigger = page.getByRole('button', { name: /Details anzeigen/ }).first()
    if (await detailsTrigger.isVisible()) {
      await detailsTrigger.click()
      await expect(page.getByText(/Insight:|Quelle:/).first()).toBeVisible()
    }
  })

  // AC: Bestätigen → Karte zeigt "Bestätigt" + Rückgängig-Link
  test.skip('zeigt nach Bestätigen den Zustand "Bestätigt" und einen Rückgängig-Link', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /Vorschlag bestätigen/ }).first().click()
    await expect(page.getByText('Bestätigt').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Aktion rückgängig machen' }).first()).toBeVisible()
  })

  // AC: Rückgängig → Karte kehrt in pending zurück (Buttons wieder da)
  test.skip('macht eine Aktion über den Rückgängig-Link rückgängig', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /Vorschlag bestätigen/ }).first().click()
    await expect(page.getByText('Bestätigt').first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Aktion rückgängig machen' }).first().click()
    await expect(page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()).toBeVisible({ timeout: 10000 })
  })

  // AC: Nach Reload verschwinden bearbeitete Karten
  test.skip('entfernt bearbeitete Karten nach einem Seiten-Reload', async ({ page }) => {
    await login(page)
    const firstCardTitle = await page.locator('h3').first().textContent()
    await page.getByRole('button', { name: /Vorschlag ablehnen/ }).first().click()
    await expect(page.getByText('Abgelehnt').first()).toBeVisible({ timeout: 10000 })
    await page.reload()
    // Der abgelehnte Vorschlag taucht nicht mehr auf
    if (firstCardTitle) {
      await expect(page.getByText(firstCardTitle, { exact: true })).toHaveCount(0)
    }
  })

  // AC: Empty State wenn keine offenen Vorschläge
  test.skip('zeigt den Empty State wenn keine offenen Vorschläge vorhanden sind', async ({ page }) => {
    await login(page)
    await expect(page.getByText('Alle Vorschläge bearbeitet')).toBeVisible()
    await expect(page.getByText(/NORA arbeitet bereits am nächsten Report/)).toBeVisible()
  })
})
