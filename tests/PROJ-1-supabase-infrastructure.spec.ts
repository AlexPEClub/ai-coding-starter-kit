import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-1: Supabase Infrastructure Setup
 *
 * Hinweis: Tests die einen erfolgreichen Login erfordern (AC2, AC4, AC5)
 * benötigen gültige Supabase-Credentials in .env.local und einen
 * angelegten Test-Nutzer. Sie sind mit test.skip markiert, bis diese
 * vorhanden sind.
 */

test.describe('PROJ-1: Route-Schutz & Login', () => {
  // AC1: Nicht eingeloggt → Weiterleitung zur Login-Seite
  test('leitet nicht eingeloggte Nutzer von / zur Login-Seite weiter', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('leitet nicht eingeloggte Nutzer von /dashboard zur Login-Seite weiter', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('leitet von beliebiger geschützter Route zur Login-Seite weiter', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login$/)
  })

  // Login-Seite rendert Branding + Formular
  test('zeigt das Nexora AI Branding und NORA-Badge auf der Login-Seite', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('NEXORA AI')).toBeVisible()
    await expect(page.getByText('NORA ist bereit')).toBeVisible()
  })

  test('zeigt E-Mail- und Passwort-Felder auf der Login-Seite', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  // Edge Case: Leeres Formular → Button deaktiviert
  test('Anmelden-Button ist deaktiviert, solange das Formular leer ist', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeDisabled()
  })

  test('Anmelden-Button wird aktiv, sobald beide Felder ausgefüllt sind', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('stefan@nexora.ai')
    await page.locator('#password').fill('geheim123')
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeEnabled()
  })

  // AC3: Falsche Zugangsdaten → klare Fehlermeldung (kein Stack-Trace)
  test('zeigt eine klare Fehlermeldung bei falschen Zugangsdaten', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('falsch@example.com')
    await page.locator('#password').fill('falschesPasswort')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // Fehlermeldung erscheint, ohne technischen Stack-Trace
    await expect(page.getByText(/ungültig|Verbindungsfehler/)).toBeVisible({ timeout: 10000 })
  })

  // AC2: Erfolgreicher Login → Weiterleitung zum Dashboard
  // Benötigt gültige Credentials + Test-Nutzer
  test.skip('leitet nach erfolgreichem Login zum Dashboard weiter', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(process.env.E2E_TEST_EMAIL!)
    await page.locator('#password').fill(process.env.E2E_TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  // AC4: Session-Persistenz nach Browser-Neustart
  test.skip('hält die Session nach erneutem Öffnen aufrecht', async ({ page, context }) => {
    // Login ausführen, dann neuen Tab im selben Context öffnen
    await page.goto('/login')
    await page.locator('#email').fill(process.env.E2E_TEST_EMAIL!)
    await page.locator('#password').fill(process.env.E2E_TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    const newPage = await context.newPage()
    await newPage.goto('/dashboard')
    await expect(newPage).toHaveURL(/\/dashboard$/)
  })
})
