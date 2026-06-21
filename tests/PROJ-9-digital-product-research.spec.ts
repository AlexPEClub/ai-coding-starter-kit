import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-9: Digital Product Research (Demand Validation)
 *
 * PROJ-9 fügt eine 4. Vorschlags-Kategorie „Produkt-Chance" (digital_product) hinzu.
 * Die Kern-Logik wird vollständig durch Unit-Tests abgedeckt:
 *   - src/lib/anthropic.test.ts        (5 Tests: generateProductOpportunity)
 *   - src/app/api/generate-suggestions/route.test.ts (2 Tests: Anhängen an Batch / best-effort)
 *
 * Die Generierung erfordert Claude-API + Supabase-Credentials und ist daher hier
 * mit test.skip markiert (analog PROJ-7). Der Route-Schutz läuft ohne Credentials.
 */

test.describe('PROJ-9: Route-Schutz (keine Credentials nötig)', () => {
  test('leitet nicht eingeloggte Nutzer von /dashboard zur Login-Seite weiter', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('gibt 401 zurück für nicht autorisierte Anfragen an /api/generate-suggestions', async ({ request }) => {
    const res = await request.post('/api/generate-suggestions')
    expect(res.status()).toBe(401)
  })
})

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('#email').fill(process.env.E2E_TEST_EMAIL!)
  await page.locator('#password').fill(process.env.E2E_TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test.describe('PROJ-9: Produkt-Chance im Dashboard (eingeloggt, Credentials nötig)', () => {
  // AC1: Batch enthält genau eine Produkt-Chance zusätzlich zu den bestehenden Kategorien
  test.skip('zeigt die Gruppe „Produkt-Chance" nach einer Generierung', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'Produkt-Chance' })).toBeVisible()
  })

  // AC2: Detailfelder (Format, Preisrahmen, ...) sind sichtbar
  test.skip('zeigt die Detailfelder einer Produkt-Chance', async ({ page }) => {
    await login(page)
    const card = page.locator('section[aria-label="Produkt-Chance"]').first()
    await expect(card.getByText(/Format:/)).toBeVisible()
    await expect(card.getByText(/Preisrahmen:/)).toBeVisible()
    await expect(card.getByText(/Verkaufsplattformen:/)).toBeVisible()
  })

  // AC5: Bestätigte Produkt-Chance → Monday-Task + Notion-Dokument (gleicher Handoff)
  test.skip('legt bei Bestätigung einen Monday-Task + Notion-Dokument an', async ({ page }) => {
    await login(page)
    const card = page.locator('section[aria-label="Produkt-Chance"]').first()
    await card.getByRole('button', { name: /Bestätigen/ }).first().click()
    await expect(page.getByText(/Task erstellt/)).toBeVisible()
  })

  // AC6: Sheet fehlt/leer → Produkt-Chance entfällt still, restliche Generierung läuft
  test.skip('Generierung läuft auch ohne Produkt-Chance fehlerfrei durch', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    test.skip(!cronSecret, 'CRON_SECRET nicht gesetzt')
    const res = await request.get('/api/generate-suggestions', {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    expect([200]).toContain(res.status())
    const body = await res.json() as { skipped?: boolean; success?: boolean }
    expect(body.skipped ?? body.success).toBeTruthy()
  })
})
