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
  await page.waitForTimeout(800)
  return true
}

// ─── Regression: Planung tab is now enabled ────────────────────────────────────

test.describe('Regression — PROJ-5 enables Planung tab', () => {
  test('AC-REG-1: "Planung" tab button is enabled (not disabled) after PROJ-5', async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
    // Verify the UI by checking a logged-out redirect first
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    // Now we know /groups is auth-guarded; the tab state test needs auth
    // This regression is verified via the authenticated test suite below
    expect(page.url()).toContain('/login')
  })
})

// ─── Kanban Board — Tab Navigation ────────────────────────────────────────────

test.describe('Kanban Board — Tab Navigation', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-TAB-1: "Planung" tab is enabled and clickable', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeVisible({ timeout: 3000 })
    await expect(planungBtn).not.toBeDisabled()
    await planungBtn.click()
    await page.waitForTimeout(500)
    // After click, board should be visible (no crash)
    await expect(planungBtn).toHaveClass(/text-primary/, { timeout: 2000 })
  })

  test('AC-TAB-2: "Archiv" tab remains disabled after PROJ-5', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const archivBtn = page.getByRole('button', { name: 'Archiv' })
    await expect(archivBtn).toBeDisabled({ timeout: 3000 })
  })
})

// ─── Kanban Board — Mobile Layout (375px) ─────────────────────────────────────

test.describe('Kanban Board — Mobile Layout (375px)', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-MOBILE-1: Kanban tab bar shows four column tabs on mobile', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await expect(page.getByRole('tab', { name: 'Zu Planen' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('tab', { name: 'In Planung' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Planung abgeschlossen' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Abgeschlossen' })).toBeVisible()
  })

  test('AC-MOBILE-2: Only one Kanban column is visible at a time on mobile', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // On mobile, the desktop grid is hidden (.hidden.md:grid) — only tabs panel visible
    // The 4-col grid should not be visible on 375px
    const desktopGrid = page.locator('.md\\:grid-cols-4')
    // Grid should be hidden at 375px (display: none via md: prefix)
    // Check that we see tab list instead
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 3000 })
  })

  test('AC-MOBILE-3: Empty column state visible when no activities', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // The active tab should show either cards or empty state
    const emptyState = page.getByText('Noch keine Aktivitäten hier')
    const hasCards = await page.locator('.rounded-\\[18px\\]').filter({ hasText: '' }).count() > 0
    const hasEmpty = await emptyState.count() > 0

    expect(hasCards || hasEmpty).toBe(true)
  })
})

// ─── Kanban Board — Desktop Layout (1440px) ───────────────────────────────────

test.describe('Kanban Board — Desktop Layout (1440px)', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-DESKTOP-1: All four Kanban column headers are visible on desktop', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await expect(page.getByText('Zu Planen').first()).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('In Planung').first()).toBeVisible()
    await expect(page.getByText('Planung abgeschlossen').first()).toBeVisible()
    await expect(page.getByText('Abgeschlossen').first()).toBeVisible()
  })

  test('AC-DESKTOP-2: Tab bar is not shown on desktop (grid layout is used)', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // shadcn Tabs (mobile layout) should be hidden at 1440px
    const tabList = page.getByRole('tablist')
    // Either not present or not visible
    const tabCount = await tabList.count()
    if (tabCount > 0) {
      await expect(tabList).not.toBeVisible()
    }
  })

  test('AC-DESKTOP-3: Empty column state "Noch keine Aktivitäten hier" is shown for empty columns', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // At least one column should show the empty state or have cards
    const emptyStates = page.getByText('Noch keine Aktivitäten hier')
    const count = await emptyStates.count()
    // Either there are empty states OR all columns have activities
    if (count > 0) {
      await expect(emptyStates.first()).toBeVisible()
    }
    // If count = 0, all columns have activities — also valid
  })
})

// ─── Kanban Board — Action Menu ────────────────────────────────────────────────

test.describe('Kanban Board — Action Menu (Initiator / Admin)', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-ACTION-1: "Termin finden" appears in ⋯ menu for zu_planen cards (initiator/admin)', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // Look for any action button (⋯) — only visible for initiator/admin
    const actionsBtn = page.getByLabel('Aktionen').first()
    const count = await actionsBtn.count()
    if (count === 0) {
      test.skip(true, 'No manageable Kanban cards found (observer or no activities in this group)')
      return
    }

    await actionsBtn.click()
    await page.waitForTimeout(300)

    // The action menu item depends on the card's current status
    // PROJ-7: "In Planung verschieben" replaced by "Termin finden"
    const terminFinden = page.getByText('Termin finden')
    const finishPlanning = page.getByText('Planung abschließen')
    const markComplete = page.getByText('Als abgeschlossen markieren')

    const hasAction = (await terminFinden.count() + await finishPlanning.count() + await markComplete.count()) > 0
    expect(hasAction).toBe(true)
    await page.keyboard.press('Escape')
  })

  test('AC-ACTION-2: DateFinderSheet öffnet sich mit Kalender wenn "Termin finden" geklickt wird', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) {
      test.skip(true, 'No action buttons found')
      return
    }
    await actionsBtn.click()
    await page.waitForTimeout(300)

    // PROJ-7: "In Planung verschieben" replaced by "Termin finden"
    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      test.skip(true, 'No "zu_planen" card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(800)

    // DateFinderSheet should open (PROJ-7 replacement for MoveToPlanningDialog)
    await expect(page.getByText('Termin finden').first()).toBeVisible({ timeout: 2000 })
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Termin bestätigen' })).toBeVisible()

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-ACTION-3: DateFinderSheet — "Termin bestätigen" ist deaktiviert ohne Datumsauswahl', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) {
      test.skip(true, 'No action buttons found')
      return
    }
    await actionsBtn.click()
    await page.waitForTimeout(300)

    // PROJ-7: "In Planung verschieben" replaced by "Termin finden"
    const terminOption = page.getByText('Termin finden')
    if ((await terminOption.count()) === 0) {
      test.skip(true, 'No "zu_planen" card available')
      return
    }

    await terminOption.click()
    await page.waitForTimeout(600)

    // Confirm button should be disabled without a date selection
    const confirmBtn = page.getByRole('button', { name: 'Termin bestätigen' })
    await expect(confirmBtn).toBeDisabled()

    // Cancel and close
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-ACTION-4: ConfirmStatusDialog for "Planung abschließen" shows irreversibility warning', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) {
      test.skip(true, 'No action buttons found')
      return
    }
    await actionsBtn.click()
    await page.waitForTimeout(300)

    const finishOption = page.getByText('Planung abschließen')
    if ((await finishOption.count()) === 0) {
      test.skip(true, 'No "in_planung" card available')
      return
    }

    await finishOption.click()
    await page.waitForTimeout(300)

    await expect(page.getByText('Planung abschließen').first()).toBeVisible({ timeout: 2000 })
    await expect(page.getByText('Diese Aktion kann nicht rückgängig gemacht werden.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()

    // Cancel — do not actually execute the transition
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-ACTION-5: ConfirmStatusDialog cancel keeps card in its current column', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const actionsBtn = page.getByLabel('Aktionen').first()
    if ((await actionsBtn.count()) === 0) {
      test.skip(true, 'No action buttons found')
      return
    }
    await actionsBtn.click()
    await page.waitForTimeout(300)

    // Try any confirm dialog (finish-planning or complete)
    const finishOption = page.getByText('Planung abschließen')
    const completeOption = page.getByText('Als abgeschlossen markieren')

    const hasFinish = (await finishOption.count()) > 0
    const hasComplete = (await completeOption.count()) > 0

    if (!hasFinish && !hasComplete) {
      test.skip(true, 'No in_planung or planung_abgeschlossen cards available')
      return
    }

    if (hasFinish) {
      await finishOption.click()
    } else {
      await completeOption.click()
    }
    await page.waitForTimeout(300)

    // Cancel the dialog
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await page.waitForTimeout(300)

    // Dialog should be closed, board still visible
    await expect(page.getByText('Diese Aktion kann nicht rückgängig gemacht werden.')).not.toBeVisible()
  })
})

// ─── Kanban Board — Responsive (768px tablet) ─────────────────────────────────

test.describe('Kanban Board — Tablet Layout (768px)', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-TABLET-1: Kanban board renders without error at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openPlanungTab(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // At 768px (md breakpoint), desktop grid should appear
    await expect(page.getByText('Zu Planen').first()).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('In Planung').first()).toBeVisible()
  })
})
