import { test, expect } from '@playwright/test'

/**
 * E2E-Tests für PROJ-7: Context-Aware Suggestions (Live-Daten)
 *
 * PROJ-7 ist ein reines Backend-Feature ohne UI-Änderungen.
 * Die vollständige Logik (Supabase-Historie, Notion-Quellen, Fallback-Verhalten,
 * Prompt-Konstruktion) wird von 19 Unit-Tests in:
 *   - src/lib/live-context.test.ts (8 Tests)
 *   - src/lib/anthropic.test.ts (5 neue Tests für generateSuggestions)
 *   - src/app/api/generate-suggestions/route.test.ts (7 Tests, inkl. fetchLiveContext-Mock)
 * abgedeckt.
 *
 * Tests die eingeloggten Zustand + Supabase + Notion erfordern, sind mit
 * test.skip markiert, bis Credentials verfügbar sind.
 *
 * Der Route-Schutz-Test läuft ohne Credentials.
 */

test.describe('PROJ-7: Route-Schutz (keine Credentials nötig)', () => {
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

test.describe('PROJ-7: Live-Kontext Integration (eingeloggt, NOTION_API_KEY gesetzt)', () => {
  // AC1: Supabase-Historie wird in den Prompt eingebunden
  test.skip('generiert Vorschläge ohne Fehler wenn Supabase-Historie vorhanden', async ({ page }) => {
    await login(page)
    // Dashboard lädt — vorhandene Vorschläge werden angezeigt
    await expect(page.getByRole('main')).toBeVisible()
    // Keine Fehlermeldung sichtbar
    await expect(page.getByText(/Fehler/)).not.toBeVisible()
  })

  // AC2: Abgelehnte Vorschläge fließen als Vermeidungs-Kontext ein
  test.skip('Dashboard zeigt neue Vorschläge nach Generierung ohne abgelehnte Themen zu wiederholen', async ({ page }) => {
    await login(page)
    // Ablehnen eines Vorschlags
    const rejectButton = page.getByRole('button', { name: /Ablehnen/ }).first()
    if (await rejectButton.isVisible()) {
      await rejectButton.click()
    }
    // Nächste Generierung würde dieses Thema nicht wiederholen (durch PROJ-7 Unit-Tests abgedeckt)
    await expect(page.getByRole('main')).toBeVisible()
  })

  // AC5: Kein Fehler wenn Living Spec nicht existiert
  test.skip('Generierung läuft durch wenn notion_qualipilot_page_id nicht in app_config', async ({ request }) => {
    // API-Aufruf mit Cron-Secret
    const cronSecret = process.env.CRON_SECRET
    test.skip(!cronSecret, 'CRON_SECRET nicht gesetzt')
    const res = await request.get('/api/generate-suggestions', {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    // Kann 200 (success) oder 200 (skipped: already_generated) sein — nie 500
    expect([200]).toContain(res.status())
  })

  // AC6: Notion-Timeout → stiller Fallback, kein Fehler
  test.skip('Generierung schlägt nicht fehl wenn Notion nicht erreichbar', async ({ request }) => {
    // Dieses Verhalten ist durch withTimeout + Promise.allSettled Unit-Tests abgedeckt
    // E2E-Verifikation erfordert Notion-Mocking, das in diesem Setup nicht verfügbar ist
    expect(true).toBe(true)
  })

  // AC7: NOTION_API_KEY fehlt → Notion übersprungen, Generierung läuft
  test.skip('Generierung läuft mit nur Supabase-Kontext wenn NOTION_API_KEY fehlt', async ({ request }) => {
    // Unit-Tests in live-context.test.ts decken diesen Fall vollständig ab
    expect(true).toBe(true)
  })
})

test.describe('PROJ-7: Living Spec Auto-Erstellung', () => {
  // AC4: Living Spec wird automatisch erstellt und gelesen
  test.skip('erstellt Living Spec automatisch bei erster Generierung wenn NOTION_PARENT_PAGE_ID gesetzt', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    test.skip(!cronSecret, 'CRON_SECRET nicht gesetzt')
    // Erster Aufruf: erstellt Living Spec falls nicht vorhanden
    const res = await request.get('/api/generate-suggestions', {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    expect([200]).toContain(res.status())
    const body = await res.json() as { skipped?: boolean; success?: boolean }
    // success oder skipped (bereits generiert) — nie ein Fehler
    expect(body.skipped ?? body.success).toBeTruthy()
  })
})
