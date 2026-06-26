import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-8: Notion-Dokument-Ausarbeitung
 *
 * Tests mit eingeloggtem Zustand benötigen gültige Supabase-Credentials (.env.local),
 * einen Test-Nutzer, Seed-Daten in `suggestions`, MONDAY_API_KEY, NOTION_API_KEY
 * und NOTION_PARENT_PAGE_ID — sowie eine laufende Supabase-Instanz.
 * Sie sind mit test.skip markiert, bis diese vorhanden sind.
 *
 * Der Route-Schutz-Test läuft ohne Credentials.
 */

test.describe('PROJ-8: Route-Schutz (keine Credentials nötig)', () => {
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

test.describe('PROJ-8: Dokument-Ausarbeitung bei Bestätigung (eingeloggt)', () => {
  // AC-1: Marketing → LinkedIn-Post/Blogpost in Notion
  test.skip('erstellt ausgearbeiteten LinkedIn-Post-Entwurf in Notion für Marketing-Vorschlag', async ({ page }) => {
    await login(page)
    // Einen Marketing-Vorschlag suchen und bestätigen
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await expect(approveButton).toBeVisible()
    await approveButton.click()
    // Loading-Spinner erscheint (Ausarbeitung dauert länger als zuvor)
    await expect(page.getByText('Speichere…').first()).toBeVisible()
    // Notion-Success-Toast mit Link erscheint (erhöhtes Timeout wegen Claude-Ausarbeitung)
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('button', { name: /In Notion öffnen/ })).toBeVisible()
    // Kein elaboration_warning-Toast bei Erfolg
    await expect(page.getByText(/Voll-Ausarbeitung fehlgeschlagen/)).not.toBeVisible()
    // Karte zeigt "Bestätigt"
    await expect(page.getByText('Bestätigt').first()).toBeVisible()
  })

  // AC-2: Produkt → Spec-Konzept in Notion
  test.skip('erstellt ausgearbeitetes Feature-Konzept für Produkt-Vorschlag', async ({ page }) => {
    // Erfordert manuell überprüfbares Notion-Dokument mit Abschnitten
    // "Problem", "Lösung", "Umsetzungsschritte", "Erfolgskriterium"
    test.fixme()
  })

  // AC-3: Operations → Schritt-für-Schritt-Prozess in Notion
  test.skip('erstellt Schritt-für-Schritt-Checkliste für Operations-Vorschlag', async ({ page }) => {
    // Erfordert manuell überprüfbares Notion-Dokument mit "Schritte"-Abschnitt
    test.fixme()
  })

  // AC-4: Kordix-Markenstimme (manuell in Notion zu prüfen)
  test.skip('generiert Dokument in GMP-/Pharma-kompetenter Kordix-Markenstimme', async ({ page }) => {
    // Erfordert manuelle inhaltliche Prüfung des Notion-Dokuments
    test.fixme()
  })

  // AC-5: Fallback auf Kurztext + elaboration_warning wenn Claude fehlschlägt
  test.skip('zeigt elaboration_warning-Toast und erstellt trotzdem Notion-Seite wenn Ausarbeitung fehlschlägt', async ({ page }) => {
    // Erfordert Simulation eines Claude-Fehlers (z. B. ungültiger ANTHROPIC_API_KEY)
    // Das Verhalten ist vollständig durch unit tests (suggestions.test.ts) abgedeckt
    test.fixme()
  })

  // AC-6: Erfolg → Toast mit Notion-Link (gleich wie PROJ-5)
  test.skip('zeigt Notion-Erfolgs-Toast mit "In Notion öffnen"-Link nach Bestätigung', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('button', { name: /In Notion öffnen/ })).toBeVisible()
  })

  // AC-7: Idempotenz — Button während Aktion deaktiviert (kein Doppelklick möglich)
  test.skip('Button ist während des Bestätigungs-Vorgangs deaktiviert (kein Doppelklick)', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    // Beide Buttons sollen sofort nach dem Klick deaktiviert sein
    await expect(approveButton).toBeDisabled()
    // Warten bis Aktion abgeschlossen
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 60000 })
  })
})

test.describe('PROJ-8: Regression — PROJ-5 Notion-Verhalten unverändert', () => {
  test.skip('Notion-Seite wird weiterhin erstellt (DB-Lookup + createPage unverändert)', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Notion-Seite erstellt')).toBeVisible({ timeout: 60000 })
  })

  test.skip('Ablehnen erzeugt weiterhin keinen Notion-Toast', async ({ page }) => {
    await login(page)
    const rejectButton = page.getByRole('button', { name: /Vorschlag ablehnen/ }).first()
    await rejectButton.click()
    await expect(page.getByText('Abgelehnt').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Notion')).not.toBeVisible()
  })
})

test.describe('PROJ-8: Regression — PROJ-4 Monday-Verhalten unverändert', () => {
  test.skip('Monday-Task wird weiterhin erstellt, auch wenn Ausarbeitung läuft', async ({ page }) => {
    await login(page)
    const approveButton = page.getByRole('button', { name: /Vorschlag bestätigen/ }).first()
    await approveButton.click()
    await expect(page.getByText('✓ Task erstellt')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /In Monday öffnen/ })).toBeVisible()
  })
})
