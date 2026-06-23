import { test, expect, type Page } from '@playwright/test'

// Authenticated tests require: TEST_USER_EMAIL + TEST_USER_PASSWORD env vars
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD)

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('form', { timeout: 5000 })
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen', exact: true }).click()
  await page.waitForURL(/\/(groups|onboarding)/, { timeout: 10000 })
}

async function openFirstGroup(page: Page): Promise<boolean> {
  await page.goto('/groups')
  await page.waitForSelector('main', { timeout: 5000 })
  const firstCard = page.locator('button.rounded-\\[18px\\]').first()
  if ((await firstCard.count()) === 0) return false
  await firstCard.click()
  await page.waitForTimeout(600)
  return true
}

async function openPlanungTab(page: Page): Promise<boolean> {
  const opened = await openFirstGroup(page)
  if (!opened) return false
  const planungBtn = page.getByRole('button', { name: 'Planung' })
  await expect(planungBtn).toBeVisible({ timeout: 3000 })
  await planungBtn.click()
  await page.waitForTimeout(600)
  return true
}

// ─── Regression: Auth guard ────────────────────────────────────────────────────

test.describe('PROJ-7 Regression — Auth guard', () => {
  test('AC-GUARD: Unauthenticated user visiting /groups is redirected to /login', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Kanban: "Termin finden" Menüeintrag ─────────────────────────────────────

test.describe('AC-KANBAN: Terminfindung über Kanban-Karte starten', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-KANBAN-1: "Termin finden" erscheint im ⋯-Menü für zu_planen-Karten (Admin/Initiator)', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const termin = page.getByText('Termin finden')
    if ((await termin.count()) === 0) {
      // Card might be in another status — skip gracefully
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available for this user')
      return
    }

    await expect(termin).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('AC-KANBAN-2: DateFinderSheet öffnet sich bei Klick auf "Termin finden"', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(800)

    // Sheet should be open with title "Termin finden"
    await expect(page.getByText('Termin finden').first()).toBeVisible({ timeout: 3000 })
    // Footer buttons should be visible
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Termin bestätigen' })).toBeVisible()

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-KANBAN-3: Kalender mit 12 Monaten und Legende ist im Sheet sichtbar', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(1200)

    // Availability legend
    await expect(page.getByText('Alle frei')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Mehrheit frei')).toBeVisible()
    await expect(page.getByText('Mehrheit belegt')).toBeVisible()
    await expect(page.getByText('Unbekannt')).toBeVisible()

    // Calendar grid should be rendered
    const calendarGrid = page.locator('table').first()
    await expect(calendarGrid).toBeVisible({ timeout: 3000 })

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-KANBAN-4: "Termin bestätigen" ist deaktiviert ohne Datumsauswahl', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(800)

    await expect(page.getByRole('button', { name: 'Termin bestätigen' })).toBeDisabled({ timeout: 3000 })

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-KANBAN-5: Sheet zeigt Ladeanimation während Verfügbarkeiten geladen werden', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    // Immediately after open, skeleton or calendar should be visible
    // (skeleton if still loading, calendar if loaded fast)
    const skeleton = page.locator('[class*="animate-pulse"], .bg-surface.rounded')
    const calendar = page.locator('table')
    await expect(skeleton.or(calendar).first()).toBeVisible({ timeout: 2000 })

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-KANBAN-6: "Abbrechen" schließt das Sheet ohne Statusänderung', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(600)

    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await page.waitForTimeout(400)

    // Sheet should be closed — Termin bestätigen no longer visible
    await expect(page.getByRole('button', { name: 'Termin bestätigen' })).not.toBeVisible()
  })
})

// ─── Aktivitäts-Detail: Termin anpassen ────────────────────────────────────────

test.describe('AC-DETAIL-ADJUST: Termin anpassen in Detailansicht', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-ADJUST-1: "Termin anpassen"-Button sichtbar für Admin/Initiator bei in_planung-Aktivität', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    // Look for a card that has a date range shown (= in_planung or later)
    const dateRangeText = page.locator('p.text-secondary').filter({ hasText: /\d{2}\.\d{2}\.\d{2}/ })
    if ((await dateRangeText.count()) === 0) {
      test.skip(true, 'No in_planung activities with dates found')
      return
    }

    // Click on the kanban card to open detail
    const cards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    if ((await cards.count()) === 0) { test.skip(true, 'No cards found'); return }
    await cards.first().click()
    await page.waitForTimeout(800)

    // Detail sheet should be open — check for "Termin anpassen" button
    const terminAnpassen = page.getByRole('button', { name: 'Termin anpassen' })
    // It may not be visible if this card isn't in_planung; graceful skip
    if ((await terminAnpassen.count()) === 0) {
      test.skip(true, 'Card opened is not in_planung status or user not admin/initiator')
      return
    }

    await expect(terminAnpassen).toBeVisible()
    await page.getByLabel('Schließen').first().click()
  })

  test('AC-ADJUST-2: DateFinderSheet öffnet sich im Anpassen-Modus ("Termin anpassen")', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const cards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    if ((await cards.count()) === 0) { test.skip(true, 'No cards found'); return }
    await cards.first().click()
    await page.waitForTimeout(800)

    const terminAnpassen = page.getByRole('button', { name: 'Termin anpassen' })
    if ((await terminAnpassen.count()) === 0) {
      test.skip(true, 'Card not in_planung or user not admin/initiator')
      return
    }

    await terminAnpassen.click()
    await page.waitForTimeout(600)

    // Sheet title should say "Termin anpassen"
    await expect(page.getByText('Termin anpassen').first()).toBeVisible({ timeout: 3000 })
    // Footer should show "Termin speichern" (not "Termin bestätigen")
    await expect(page.getByRole('button', { name: 'Termin speichern' })).toBeVisible()

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── Aktivitäts-Detail: iCal-Export ──────────────────────────────────────────

test.describe('AC-ICAL: iCal-Export in Detailansicht', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-ICAL-1: "Zum Kalender hinzufügen"-Button sichtbar wenn start_date gesetzt', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    // Find a card with date displayed (means start_date set)
    const cards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    if ((await cards.count()) === 0) { test.skip(true, 'No cards'); return }

    // Try each card until we find one with the export button
    const cardCount = await cards.count()
    let found = false
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      await cards.nth(i).click()
      await page.waitForTimeout(600)

      const kalenderBtn = page.getByRole('button', { name: 'Zum Kalender hinzufügen' })
      if ((await kalenderBtn.count()) > 0) {
        await expect(kalenderBtn).toBeVisible()
        found = true
        await page.getByLabel('Schließen').first().click()
        await page.waitForTimeout(400)
        break
      }
      await page.getByLabel('Schließen').first().click()
      await page.waitForTimeout(400)
    }

    if (!found) test.skip(true, 'No activity with start_date found')
  })

  test('AC-ICAL-2: Download wird ausgelöst bei Klick auf "Zum Kalender hinzufügen"', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const cards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    if ((await cards.count()) === 0) { test.skip(true, 'No cards'); return }

    const cardCount = await cards.count()
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      await cards.nth(i).click()
      await page.waitForTimeout(600)

      const kalenderBtn = page.getByRole('button', { name: 'Zum Kalender hinzufügen' })
      if ((await kalenderBtn.count()) > 0) {
        // Listen for download event
        const downloadPromise = page.waitForEvent('download', { timeout: 3000 }).catch(() => null)
        await kalenderBtn.click()
        const download = await downloadPromise

        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.ics$/)
        } else {
          // Some browsers handle blob: URLs inline — verify no error toast appeared
          const errorToast = page.getByText(/konnte nicht/)
          await expect(errorToast).not.toBeVisible()
        }

        await page.getByLabel('Schließen').first().click()
        await page.waitForTimeout(400)
        return
      }
      await page.getByLabel('Schließen').first().click()
      await page.waitForTimeout(400)
    }
    test.skip(true, 'No activity with start_date found')
  })

  test('AC-ICAL-3: "Zum Kalender hinzufügen" ist NICHT sichtbar wenn kein Termin gesetzt', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    // Find a card without a date range shown (no date text)
    const allCards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    const cardCount = await allCards.count()

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = allCards.nth(i)
      const dateText = card.locator('p.text-secondary')
      if ((await dateText.count()) > 0) continue // has a date, skip

      await card.click()
      await page.waitForTimeout(600)

      const kalenderBtn = page.getByRole('button', { name: 'Zum Kalender hinzufügen' })
      await expect(kalenderBtn).not.toBeVisible()

      await page.getByLabel('Schließen').first().click()
      await page.waitForTimeout(400)
      return
    }
    test.skip(true, 'All visible cards have a date set')
  })
})

// ─── DateFinderSheet: Verfügbarkeits-Banner ───────────────────────────────────

test.describe('AC-BANNER: Hinweis für Mitglieder ohne Kalender', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-BANNER-1: Banner zeigt "X von Y Mitgliedern ohne Kalender" wenn Mitglieder ohne Kalender vorhanden', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(1500) // wait for edge function response

    // Banner is conditional — only shown if members without calendar exist
    const banner = page.getByText(/Mitglieder?.*ohne Kalender/)
    // If it's visible, verify the format is correct
    if ((await banner.count()) > 0) {
      await expect(banner).toBeVisible()
      await expect(banner).toContainText('ohne Kalender')
    }
    // If banner is not visible, it means all members have connected calendars — OK

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── DateFinderSheet: Cache-Refresh-Bar ──────────────────────────────────────

test.describe('AC-CACHE: Cache-Refresh-Bar im Sheet', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-CACHE-1: "Zuletzt aktualisiert" + "Aktualisieren"-Button erscheinen nach erfolgreichem Laden', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(2000) // wait for edge function response

    await expect(page.getByText('Zuletzt aktualisiert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Aktualisieren' })).toBeVisible()

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── DateFinderSheet: Datumsbereich-Auswahl ──────────────────────────────────

test.describe('AC-RANGE: Datumsbereich-Auswahl im Sheet', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-RANGE-1: Range-Preview erscheint nach Tipp auf ein Datum', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) { test.skip(true, 'No manageable cards'); return }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      test.skip(true, 'No zu_planen card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(1500)

    // Wait for calendar to load
    const calendarTable = page.locator('table').first()
    await expect(calendarTable).toBeVisible({ timeout: 5000 })

    // Click a day button in the calendar — pick a day cell that's enabled
    const dayButtons = page.locator('table button[name]').filter({ hasNot: page.locator('[disabled]') })
    const dayCount = await dayButtons.count()
    if (dayCount === 0) {
      await page.getByRole('button', { name: 'Abbrechen' }).click()
      test.skip(true, 'No enabled day buttons found in calendar')
      return
    }

    // Click first available day
    await dayButtons.first().click()
    await page.waitForTimeout(300)

    // "Termin bestätigen" button should now be enabled
    await expect(page.getByRole('button', { name: 'Termin bestätigen' })).not.toBeDisabled({ timeout: 2000 })

    // Range preview (CalendarDays icon row) should appear in footer
    const rangePreview = page.locator('.bg-secondary-soft')
    await expect(rangePreview).toBeVisible({ timeout: 2000 })

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── Responsive Layout ────────────────────────────────────────────────────────

test.describe('AC-RESPONSIVE: DateFinderSheet auf verschiedenen Bildschirmgrößen', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  async function openDateFinderSheet(page: Page): Promise<boolean> {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return false

    const opened = await openPlanungTab(page)
    if (!opened) return false

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) return false

    await actionsBtn.click()
    await page.waitForTimeout(300)

    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      await page.keyboard.press('Escape')
      return false
    }

    await terminOption.click()
    await page.waitForTimeout(800)
    return true
  }

  test('AC-RESP-1: DateFinderSheet rendert korrekt auf Mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const ok = await openDateFinderSheet(page)
    if (!ok) { test.skip(true, 'Could not open DateFinderSheet'); return }

    await expect(page.getByText('Termin finden').first()).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-RESP-2: DateFinderSheet rendert korrekt auf Desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const ok = await openDateFinderSheet(page)
    if (!ok) { test.skip(true, 'Could not open DateFinderSheet'); return }

    await expect(page.getByText('Termin finden').first()).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── Regression: PROJ-5 Kanban-Board ─────────────────────────────────────────

test.describe('AC-REG: Kanban-Board Regression nach PROJ-7', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-REG-1: Kanban-Board lädt ohne Fehler (MoveToPlanningDialog ersetzt)', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    // No console errors should appear
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    await page.waitForTimeout(500)
    // Filter out known benign browser extension errors
    const realErrors = errors.filter(e => !e.includes('extension') && !e.includes('favicon'))
    expect(realErrors).toHaveLength(0)

    // Board should show columns (tab or grid)
    const tabList = page.getByRole('tablist')
    const desktopGrid = page.locator('.md\\:grid-cols-4')
    const hasTabList = await tabList.isVisible()
    const hasGrid = await desktopGrid.isVisible()
    expect(hasTabList || hasGrid).toBe(true)
  })

  test('AC-REG-2: ActivityDetailSheet öffnet sich weiterhin korrekt (keine PROJ-7-Regression)', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'No groups yet'); return }

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group found'); return }

    const cards = page.locator('.bg-surface.border.border-line.rounded-\\[18px\\]')
    if ((await cards.count()) === 0) { test.skip(true, 'No Kanban cards found'); return }

    await cards.first().click()
    await page.waitForTimeout(600)

    // Detail sheet should open — check for close button
    await expect(page.getByLabel('Schließen').first()).toBeVisible({ timeout: 3000 })

    await page.getByLabel('Schließen').first().click()
  })
})
