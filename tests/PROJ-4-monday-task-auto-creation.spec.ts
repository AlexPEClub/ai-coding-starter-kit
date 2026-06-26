import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-4: Monday.com Task Auto-Creation
 *
 * Tests die eingeloggten Zustand + Monday.com-Integration prüfen,
 * benötigen gültige Supabase-Credentials (.env.local), einen Test-Nutzer,
 * Seed-Daten in `suggestions` und einen gültigen MONDAY_API_KEY.
 * Sie sind mit test.skip markiert, bis diese vorhanden sind.
 *
 * Der Route-Schutz-Test läuft ohne Credentials.
 */

test.describe('PROJ-4: Route-Schutz (keine Credentials nötig)', () => {
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

test.describe('PROJ-4: Monday Task Auto-Creation (eingeloggt)', () => {
  // AC: Task-Erstellung + Erfolgs-Toast mit Link
  test.skip('erstellt Monday-Task beim Bestätigen und zeigt Toast mit Link', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await expect(approveButton).toBeVisible()
    await approveButton.click()
    // Toast erscheint mit "Task erstellt"
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    // Action-Button "In Monday öffnen" ist sichtbar
    await expect(page.getByRole('button', { name: /In Monday öffnen/ })).toBeVisible()
  })

  // AC: Bestätigte Karte wechselt in den "Bestätigt"-Zustand
  test.skip('zeigt bestätigte Karte im grünen Zustand nach erfolgreicher Task-Erstellung', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Bestätigt').first()).toBeVisible()
    await expect(page.getByText('Rückgängig').first()).toBeVisible()
  })

  // AC: Ablehnen funktioniert weiterhin ohne Monday (kein Task, kein Toast)
  test.skip('lehnt Vorschlag ohne Monday-Aktion ab', async ({ page }) => {
    await login(page)
    const rejectButton = page.getByRole('button', { name: /Vorschlag ablehnen/ }).first()
    await rejectButton.click()
    await expect(page.getByText('Abgelehnt').first()).toBeVisible({ timeout: 5000 })
    // Kein Monday-Toast bei Ablehnen
    await expect(page.getByText('Task erstellt')).not.toBeVisible()
  })

  // AC: MONDAY_API_KEY fehlt → spezifischer Fehler-Toast
  test.skip('zeigt spezifischen Fehler wenn MONDAY_API_KEY nicht konfiguriert ist', async ({ page }) => {
    // Setzt voraus, dass MONDAY_API_KEY auf dem Server nicht gesetzt ist
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(
      page.getByText('Monday.com nicht konfiguriert — API-Key fehlt.')
    ).toBeVisible({ timeout: 10000 })
    // Karte bleibt im pending-Zustand
    await expect(approveButton).toBeVisible()
  })

  // AC: Lade-Zustand während Task-Erstellung
  test.skip('zeigt Lade-Spinner während Monday-Task erstellt wird', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    // Kurz nach Klick: Lade-Zustand mit "Speichere…"
    await expect(page.getByText('Speichere…')).toBeVisible()
    // Danach Toast
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
  })

  // AC: Kategorie-Zuordnung — Marketing-Vorschlag landet in "Marketing"-Gruppe
  test.skip('erstellt Task in der richtigen Monday-Gruppe entsprechend der Kategorie', async ({ page }) => {
    // Dieser Test erfordert Überprüfung in Monday.com selbst — nicht automatisierbar ohne Monday API Mock
    test.fixme()
  })

  // AC: Rückgängig nach Bestätigen setzt Status zurück auf pending
  test.skip('setzt Bestätigung rückgängig und zeigt Karte wieder als pending', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await page.getByText('Rückgängig').first().click()
    await expect(approveButton).toBeVisible({ timeout: 5000 })
  })

  // AC: Titel > 255 Zeichen wird auf 255 Zeichen gekürzt
  test.skip('kürzt sehr lange Titel auf 255 Zeichen für Monday-Task', async ({ page }) => {
    // Benötigt Seed-Daten mit einem Vorschlag dessen Titel > 255 Zeichen lang ist
    test.fixme()
  })
})

test.describe('PROJ-4: Regression — PROJ-3 Ablehnen und Rückgängig', () => {
  test.skip('Ablehnen und Rückgängig funktionieren weiterhin korrekt', async ({ page }) => {
    await login(page)
    const rejectButton = page.getByRole('button', { name: /Vorschlag ablehnen/ }).first()
    await rejectButton.click()
    await expect(page.getByText('Abgelehnt').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Rückgängig').first().click()
    await expect(rejectButton).toBeVisible({ timeout: 5000 })
  })
})
