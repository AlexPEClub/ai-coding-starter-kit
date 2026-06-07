import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-5: Notion Document Auto-Creation
 *
 * Tests die eingeloggten Zustand + Notion-Integration prüfen,
 * benötigen gültige Supabase-Credentials (.env.local), einen Test-Nutzer,
 * Seed-Daten in `suggestions`, einen gültigen MONDAY_API_KEY sowie
 * NOTION_API_KEY und NOTION_PARENT_PAGE_ID.
 * Sie sind mit test.skip markiert, bis diese vorhanden sind.
 *
 * Der Route-Schutz-Test läuft ohne Credentials.
 */

test.describe('PROJ-5: Route-Schutz (keine Credentials nötig)', () => {
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

test.describe('PROJ-5: Notion Document Auto-Creation (eingeloggt)', () => {
  // AC: Datenbank-Auto-Setup + Seite erstellen + Toast mit Link
  test.skip('erstellt Notion-Seite beim Bestätigen und zeigt Toast mit Link', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await expect(approveButton).toBeVisible()
    await approveButton.click()
    // Monday-Toast erscheint zuerst
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    // Notion-Toast erscheint danach
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 5000 })
    // Notion Action-Button sichtbar
    await expect(page.getByRole('button', { name: /In Notion öffnen/ })).toBeVisible()
  })

  // AC: Zweite Bestätigung verwendet gespeicherte Datenbank-ID (kein neues DB-Create)
  test.skip('verwendet bei zweiter Bestätigung die gespeicherte Datenbank-ID', async ({ page }) => {
    await login(page)
    // Erste Bestätigung — Datenbank wird angelegt + ID in app_config gespeichert
    const firstButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).nth(0)
    await firstButton.click()
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 15000 })
    // Zweite Bestätigung — soll nicht wieder eine neue DB anlegen
    const secondButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).nth(0)
    await secondButton.click()
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 15000 })
    // Kein doppelter "NORA BizDev"-Eintrag in Notion — nur manuell verifizierbar
  })

  // AC: Kategorie-Zuordnung auf Notion-Seite
  test.skip('setzt korrekte Kategorie-Eigenschaft auf der Notion-Seite', async ({ page }) => {
    // Erfordert Überprüfung in Notion — nicht ohne Notion API Mock vollständig automatisierbar
    test.fixme()
  })

  // AC: Monday-Task-Link auf Notion-Seite gesetzt
  test.skip('setzt Monday-Task-Link als Property auf der Notion-Seite', async ({ page }) => {
    // Erfordert Überprüfung in Notion — nicht ohne Notion API Mock vollständig automatisierbar
    test.fixme()
  })

  // AC: Warn-Toast wenn NOTION_API_KEY fehlt
  test.skip('zeigt Warn-Toast wenn NOTION_API_KEY nicht konfiguriert ist', async ({ page }) => {
    // Setzt voraus, dass NOTION_API_KEY auf dem Server nicht gesetzt ist
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText('Monday-Task erstellt — Notion nicht konfiguriert.')
    ).toBeVisible({ timeout: 5000 })
    // Kein Notion-Success-Toast
    await expect(page.getByText('✓ Notion-Seite erstellt')).not.toBeVisible()
    // Vorschlag trotzdem approved (Karte wechselt Zustand)
    await expect(page.getByText('Bestätigt').first()).toBeVisible()
  })

  // AC: Warn-Toast wenn Notion nicht erreichbar
  test.skip('zeigt Warn-Toast wenn Notion API nicht erreichbar ist — Approval trotzdem erfolgreich', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    // Monday geht durch
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    // Notion schlägt fehl — Warn-Toast statt Success-Toast
    await expect(page.getByText(/Notion.*nicht erreichbar|Notion.*überlastet/)).toBeVisible({ timeout: 5000 })
    // Karte ist trotzdem im approved-Zustand
    await expect(page.getByText('Bestätigt').first()).toBeVisible()
  })

  // AC: Ablehnen erzeugt keinen Notion-Toast
  test.skip('erzeugt beim Ablehnen keinen Notion-Toast', async ({ page }) => {
    await login(page)
    const rejectButton = page.getByRole('button', { name: /Vorschlag ablehnen/ }).first()
    await rejectButton.click()
    await expect(page.getByText('Abgelehnt').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Notion')).not.toBeVisible()
  })
})

test.describe('PROJ-5: Regression — PROJ-4 Monday-Verhalten unverändert', () => {
  test.skip('Monday-Task wird weiterhin korrekt erstellt und Toast erscheint', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /In Monday öffnen/ })).toBeVisible()
  })

  test.skip('Rückgängig nach Bestätigen setzt Status zurück auf pending', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await page.getByText('Rückgängig').first().click()
    await expect(approveButton).toBeVisible({ timeout: 5000 })
  })
})
