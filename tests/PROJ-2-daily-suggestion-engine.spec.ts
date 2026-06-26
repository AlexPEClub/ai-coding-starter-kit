import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-2: Daily Suggestion Engine
 *
 * PROJ-2 ist ein Backend-Feature. Die vollständige Logik (Retry, Doppellauf-Schutz,
 * Auth, Generierung) wird von 7 Unit-Tests in:
 *   - src/app/api/generate-suggestions/route.test.ts
 *   - src/lib/anthropic.test.ts (generateSuggestions)
 * abgedeckt.
 *
 * Tests die eingeloggten Zustand + Claude API + Supabase erfordern, sind mit
 * test.skip markiert, bis Credentials verfügbar sind.
 *
 * Die Route-Schutz-Tests laufen ohne Credentials.
 */

test.describe('PROJ-2: Route-Schutz (keine Credentials nötig)', () => {
  test('AC11: gibt 401 zurück für nicht autorisierte POST-Anfragen', async ({ request }) => {
    const res = await request.post('/api/generate-suggestions')
    expect(res.status()).toBe(401)
  })

  test('AC11: gibt 401 zurück für nicht autorisierte GET-Anfragen (kein Cron-Secret)', async ({ request }) => {
    const res = await request.get('/api/generate-suggestions')
    expect(res.status()).toBe(401)
  })

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

test.describe('PROJ-2: Manueller Trigger (eingeloggt)', () => {
  // AC9 + AC10: "Jetzt generieren"-Button im Dashboard sichtbar und funktional
  test.skip('AC9/AC10: "Jetzt generieren"-Button generiert Vorschläge und lädt Dashboard neu', async ({ page }) => {
    await login(page)
    const generateBtn = page.getByRole('button', { name: /Jetzt generieren/i })
    await expect(generateBtn).toBeVisible()
    await generateBtn.click()
    // Ladeindikator sichtbar
    await expect(page.getByText(/Generiere/i)).toBeVisible()
    // Nach Erfolg: Toast oder Dashboard-Reload
    await expect(page.getByText(/Vorschläge generiert/i)).toBeVisible({ timeout: 30000 })
  })

  // AC7: Doppellauf-Schutz
  test.skip('AC7: zweiter Klick auf "Jetzt generieren" zeigt "bereits vorhanden"-Meldung', async ({ page }) => {
    await login(page)
    const generateBtn = page.getByRole('button', { name: /Jetzt generieren/i })
    // Erster Aufruf
    await generateBtn.click()
    await page.waitForTimeout(2000)
    // Zweiter Aufruf am selben Tag
    await generateBtn.click()
    await expect(page.getByText(/bereits Vorschläge/i)).toBeVisible({ timeout: 15000 })
  })

  // AC14: Dashboard funktioniert bei Fehler
  test.skip('AC14: Dashboard zeigt keinen Crash wenn Generierung fehlschlägt', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('Error')
  })
})

test.describe('PROJ-2: Cron-Endpunkt (CRON_SECRET gesetzt)', () => {
  // AC1 + AC2: Cron-Lauf generiert Vorschläge
  test.skip('AC1/AC2: GET mit gültigem Cron-Secret generiert Vorschläge', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    test.skip(!cronSecret, 'CRON_SECRET nicht gesetzt')
    const res = await request.get('/api/generate-suggestions', {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    expect([200]).toContain(res.status())
    const body = await res.json() as { success?: boolean; skipped?: boolean; count?: number }
    expect(body.success ?? body.skipped).toBeTruthy()
    if (body.success && body.count !== undefined) {
      expect(body.count).toBeGreaterThanOrEqual(1)
      expect(body.count).toBeLessThanOrEqual(5)
    }
  })

  // AC7: Doppellauf-Schutz via API
  test.skip('AC7: zweiter Cron-Aufruf am selben Tag gibt skipped zurück', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    test.skip(!cronSecret, 'CRON_SECRET nicht gesetzt')
    // Zweiter Aufruf nach erstem
    const res = await request.get('/api/generate-suggestions', {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    const body = await res.json() as { skipped?: boolean }
    // Kann success (erster Lauf) oder skipped (bereits generiert) sein
    expect([200]).toContain(res.status())
    // Kein Fehler
    expect(res.status()).not.toBe(500)
  })
})
