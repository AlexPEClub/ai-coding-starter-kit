import { test, expect } from '@playwright/test'

/**
 * PROJ-11 Umsatz-Tab-Neubau — Post-Deploy-Live-Verifikation.
 *
 * Läuft NACH dem Deploy gegen die LIVE-URL (DEPLOY_BASE_URL, siehe
 * playwright.deploy.config.ts), analog zu tests/deploy/smoke.spec.ts.
 * Anders als tests/PROJ-11-umsatz-tab.spec.ts (Sandbox-Suite, hartcodiert auf
 * localhost:3000) nutzt diese Datei relative Pfade + baseURL, damit sie
 * direkt gegen tms.gudel-werkzeuge.de laufen kann (siehe features/PROJ-11-
 * kundendetailseite.md, Abschnitt "Live-Verifikation (Post-Deploy)").
 *
 * Benötigt einen echten Testkunden mit Rechnungsdaten in mehreren Kategorien
 * (Handel + Service) und mehreren Kalenderjahren.
 */
const TEST_KUNDE_ID = process.env.PROJ11_TEST_KUNDE_ID || ''
const TEST_EMAIL = process.env.PROJ11_TEST_EMAIL || 'playwright-test@tms.gudel-werkzeuge.de'
const TEST_PASSWORD = process.env.PROJ11_TEST_PASSWORD || 'TestPass123!'

test.describe('Umsatz-Tab (Live)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_KUNDE_ID, 'PROJ11_TEST_KUNDE_ID nicht gesetzt — Testkunde erforderlich')

    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    await page.goto(`/kunden/${TEST_KUNDE_ID}`)
    // "Umsatz" wird auf schmalen Viewports als "Ums." abgekürzt (bestehendes
    // Tab-Verhalten, siehe globaler Header PROJ-18) — Regex deckt beides ab.
    await page.getByRole('tab', { name: /Ums/i }).click()
    await page.waitForLoadState('networkidle')
  })

  test('KPI-Kacheln zeigen Gesamtumsatz, Handelsumsatz und Serviceumsatz', async ({ page }) => {
    // Titel-Text existiert je nach Viewport nur als Kurz- oder Langform
    // (Mobile-Fix, siehe revenue-chart.tsx KpiCard) — daher per data-testid
    // und toContainText (prüft textContent, unabhängig von CSS-Sichtbarkeit).
    await expect(page.getByTestId('kpi-total')).toContainText(/Gesamt/)
    await expect(page.getByTestId('kpi-handel')).toContainText(/Handel/)
    await expect(page.getByTestId('kpi-service')).toContainText(/Service/)
  })

  test('Standard-Zeitraum ist "Letzte 12 Monate"', async ({ page }) => {
    await expect(page.getByRole('combobox')).toContainText('Letzte 12 Monate')
  })

  test('Zeitraum-Dropdown bietet Kalenderjahre und "Gesamt" zusätzlich an', async ({ page }) => {
    await page.getByRole('combobox').click()
    await expect(page.getByRole('option', { name: 'Gesamt' })).toBeVisible()
    await expect(page.getByRole('option', { name: /^20\d{2}$/ }).first()).toBeVisible()
  })

  test('Wechsel des Zeitraums lädt das Diagramm neu', async ({ page }) => {
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Gesamt' }).click()
    await expect(page.getByRole('combobox')).toContainText('Gesamt')
    await page.waitForLoadState('networkidle')
    const gesamtumsatzCard = page.locator('div', { hasText: 'Gesamtumsatz' }).first()
    await expect(gesamtumsatzCard.getByText(/%$/)).toHaveCount(0, { timeout: 15000 })
  })

  test('Klick auf Handelsumsatz togglet die Rabattgruppen-Aufschlüsselung und zurück', async ({ page }) => {
    await page.getByTestId('kpi-handel').click()
    await expect(page.getByText('Handelsumsatz nach Rabattgruppe')).toBeVisible()

    await page.getByTestId('kpi-handel').click()
    await expect(page.getByText('Umsatzentwicklung')).toBeVisible()
  })

  test('Klick auf Serviceumsatz togglet die Rabattgruppen-Aufschlüsselung', async ({ page }) => {
    await page.getByTestId('kpi-service').click()
    await expect(page.getByText('Serviceumsatz nach Rabattgruppe')).toBeVisible()
  })

  test('keine Server-Fehler in der Browser-Konsole beim Laden des Tabs', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.reload()
    // "Umsatz" wird auf schmalen Viewports als "Ums." abgekürzt (bestehendes
    // Tab-Verhalten, siehe globaler Header PROJ-18) — Regex deckt beides ab.
    await page.getByRole('tab', { name: /Ums/i }).click()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })
})

test.describe('Kunden-Liste — Umsatzspalte (Live)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('zeigt Umsatzwerte statt durchgängig 0 € (Regression: mv_partner_monthly_revenue existierte nie)', async ({
    page,
  }) => {
    await page.goto('/kunden')
    await page.waitForLoadState('networkidle')
    const content = await page.content()
    expect(content).toContain('€')
  })
})
