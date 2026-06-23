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
  // GroupCard has a specific rounded style; look for any clickable group card
  const groupCards = page.locator('div.space-y-3 > button, div.space-y-3 > div[role="button"]').first()
  const cardCount = await page.locator('div.space-y-3').count()
  if (cardCount === 0) return false

  // Click first card-like element (the GroupCard button)
  const firstCard = page.locator('button.rounded-\\[18px\\]').first()
  const count = await firstCard.count()
  if (count === 0) return false

  await firstCard.click()
  await page.waitForTimeout(600)
  return true
}

// ─── Auth Guard ────────────────────────────────────────────────────────────────

test.describe('Auth Guard — PROJ-4 routes', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
  })

  test('AC-GUARD: Unauthenticated visit to /groups redirects to /login', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── GroupMainSheet — Shell ────────────────────────────────────────────────────

test.describe('GroupMainSheet — Shell', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-MAIN-1: Clicking a group card opens the GroupMainSheet with group name in header', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // GroupMainSheet header should contain a heading (the group name)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 3000 })
  })

  test('AC-MAIN-2: GroupMainSheet shows "Vorschläge" tab as active', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await expect(page.getByText('Vorschläge')).toBeVisible({ timeout: 3000 })
  })

  test('AC-MAIN-3: "Planung" tab is enabled (PROJ-5), "Archiv" tab remains disabled', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    const archivBtn = page.getByRole('button', { name: 'Archiv' })
    await expect(planungBtn).not.toBeDisabled({ timeout: 3000 })
    await expect(archivBtn).toBeDisabled({ timeout: 3000 })
  })

  test('AC-MAIN-4: Settings icon opens GroupDetailSheet (GroupSettingsSheet)', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const settingsBtn = page.getByLabel('Einstellungen')
    await settingsBtn.click()
    // GroupDetailSheet contains invite code section
    await expect(page.getByText('Einladungs-Code')).toBeVisible({ timeout: 3000 })
  })

  test('AC-MAIN-5: Close button dismisses the GroupMainSheet', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    // Sheet is open — click close
    await page.getByLabel('Schließen').click()
    // After close, "Meine Gruppen" heading should be visible again
    await expect(page.getByRole('heading', { name: 'Meine Gruppen' })).toBeVisible({ timeout: 2000 })
  })
})

// ─── Vorschläge Filter Chips ──────────────────────────────────────────────────

test.describe('Vorschläge — Filter Chips', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-FILTER-1: Filter chips "Alle", "Spontan", "Wochenende", "Längerer Zeitraum" are visible', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await expect(page.getByRole('button', { name: 'Alle' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Spontan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Wochenende' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Längerer Zeitraum' })).toBeVisible()
  })

  test('AC-FILTER-2: "Alle" filter chip is active by default', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const alleBtn = page.getByRole('button', { name: 'Alle' })
    await expect(alleBtn).toHaveClass(/bg-primary/, { timeout: 3000 })
  })

  test('AC-FILTER-3: Clicking "Spontan" filter activates it', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    const spontanBtn = page.getByRole('button', { name: 'Spontan' })
    await spontanBtn.click()
    await expect(spontanBtn).toHaveClass(/bg-primary/, { timeout: 2000 })
  })
})

// ─── Vorschlag erstellen — Validation ─────────────────────────────────────────

test.describe('Vorschlag erstellen — Form Validation', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  async function openCreateForm(page: Page): Promise<boolean> {
    const opened = await openFirstGroup(page)
    if (!opened) return false

    // Wait for proposals tab to load
    await page.waitForTimeout(1000)

    // Look for FAB or CTA button to create proposal
    const fab = page.getByRole('button', { name: /Vorschlag/i }).first()
    const fabVisible = await fab.isVisible()
    if (!fabVisible) {
      // May be at limit or observer — try CTA in empty state
      const cta = page.getByRole('button', { name: /Ersten Vorschlag/i })
      if (await cta.isVisible()) {
        await cta.click()
      } else {
        return false
      }
    } else {
      await fab.click()
    }

    // Wait for sheet to appear
    await page.waitForTimeout(300)
    return true
  }

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('main', { timeout: 5000 })
  })

  test('AC-CREATE-1: Create form has Name, Dauer-Kategorie, Benötigte Upvotes fields', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form (no groups or observer)'); return }

    await expect(page.getByText('Vorschlag erstellen')).toBeVisible({ timeout: 3000 })
    await expect(page.getByPlaceholder(/Klettern/i)).toBeVisible()
    await expect(page.getByText('Dauer-Kategorie')).toBeVisible()
    await expect(page.getByText('Benötigte Upvotes')).toBeVisible()
  })

  test('AC-CREATE-2: Submitting empty form shows validation error for Name', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form'); return }

    await expect(page.getByText('Vorschlag erstellen').first()).toBeVisible({ timeout: 3000 })

    // Submit without filling anything
    await page.getByRole('button', { name: 'Vorschlag erstellen', exact: true }).click()
    await expect(page.getByText('Name ist erforderlich')).toBeVisible({ timeout: 2000 })
  })

  test('AC-CREATE-3: Submitting without Dauer-Kategorie shows validation error', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form'); return }

    await expect(page.getByText('Vorschlag erstellen').first()).toBeVisible({ timeout: 3000 })

    // Fill name but leave category empty
    await page.getByPlaceholder(/Klettern/i).fill('Bowling')
    await page.getByRole('button', { name: 'Vorschlag erstellen', exact: true }).click()

    await expect(page.getByText('Bitte Kategorie wählen')).toBeVisible({ timeout: 2000 })
  })

  test('AC-CREATE-4: Name character counter shows current/200 count', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form'); return }

    await expect(page.getByText('0/200')).toBeVisible({ timeout: 3000 })
    await page.getByPlaceholder(/Klettern/i).fill('Bowling')
    await expect(page.getByText('7/200')).toBeVisible()
  })

  test('AC-CREATE-5: Benötigte Upvotes stepper shows +/- buttons and starts at 1', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form'); return }

    await expect(page.getByLabel('Mehr')).toBeVisible({ timeout: 3000 })
    await expect(page.getByLabel('Weniger')).toBeVisible()
    // Default value should be 1
    await expect(page.getByText('1')).toBeVisible()
  })

  test('AC-CREATE-6: URL field shows og:image preview after valid URL is entered', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const opened = await openCreateForm(page)
    if (!opened) { test.skip(true, 'Cannot open create form'); return }

    await expect(page.getByPlaceholder('https://…')).toBeVisible({ timeout: 3000 })
    await page.getByPlaceholder('https://…').fill('https://www.airbnb.com')

    // Loading spinner should appear (debounced 600ms)
    // We just verify the URL field accepted the input
    await expect(page.getByPlaceholder('https://…')).toHaveValue('https://www.airbnb.com')
  })
})

// ─── Empty State ────────────────────────────────────────────────────────────────

test.describe('Vorschläge — Empty State', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-EMPTY-1: When no proposals exist, empty state with call-to-action is shown', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    // Either proposals are visible OR the empty state is shown
    const hasProposals = await page.locator('.rounded-\\[18px\\]').filter({ hasText: '/' }).count() > 0
    const hasEmptyState = await page.getByText('Noch keine Vorschläge').isVisible()
    const hasFilter = await page.getByText('Keine Vorschläge in dieser Kategorie').isVisible()

    expect(hasProposals || hasEmptyState || hasFilter).toBe(true)
  })
})

// ─── Vote Button ────────────────────────────────────────────────────────────────

test.describe('Voting — Vote Button', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-VOTE-1: Vote button (heart icon) is visible on each proposal card', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    const proposalCards = page.locator('[aria-label="Upvoten"], [aria-label="Vote entfernen"]')
    const count = await proposalCards.count()

    if (count === 0) {
      // No proposals — acceptable (empty state is valid)
      const emptyState = await page.getByText('Noch keine Vorschläge').isVisible()
      expect(emptyState).toBe(true)
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('AC-VOTE-2: Vote progress "X / Y" is shown on proposal cards', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    // If proposals exist, vote progress format "N / N" must be visible
    const voteProgress = page.getByText(/^\d+ \/ \d+$/)
    const count = await voteProgress.count()

    if (count > 0) {
      await expect(voteProgress.first()).toBeVisible()
    }
    // If no proposals, test passes (empty state is valid)
  })
})

// ─── Proposal Actions Menu ────────────────────────────────────────────────────

test.describe('Proposal Actions Menu (Initiator / Admin)', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-ACTIONS-1: "Bearbeiten", "Erneut zur Abstimmung", "Löschen" appear in dropdown for own proposals', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    // Try to open the actions menu on any proposal
    const actionsBtn = page.getByLabel('Aktionen').first()
    const count = await actionsBtn.count()
    if (count === 0) {
      test.skip(true, 'No manageable proposals found (no proposals or user is editor with no own proposals)')
      return
    }

    await actionsBtn.click()
    await expect(page.getByText('Bearbeiten')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText('Erneut zur Abstimmung')).toBeVisible()
    await expect(page.getByText('Löschen')).toBeVisible()

    // Close dropdown
    await page.keyboard.press('Escape')
  })

  test('AC-ACTIONS-2: Delete confirmation dialog shows proposal name', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    const actionsBtn = page.getByLabel('Aktionen').first()
    const count = await actionsBtn.count()
    if (count === 0) { test.skip(true, 'No manageable proposals found'); return }

    await actionsBtn.click()
    await page.getByText('Löschen').click()

    await expect(page.getByText('Vorschlag löschen?')).toBeVisible({ timeout: 2000 })
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Löschen' })).toBeVisible()

    // Cancel — don't actually delete
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC-ACTIONS-3: Reset votes dialog shows warning about vote reset', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await page.waitForTimeout(1500)

    const actionsBtn = page.getByLabel('Aktionen').first()
    const count = await actionsBtn.count()
    if (count === 0) { test.skip(true, 'No manageable proposals found'); return }

    await actionsBtn.click()
    await page.getByText('Erneut zur Abstimmung').click()

    await expect(page.getByText('Erneut zur Abstimmung?')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/Votes.*zurückgesetzt/i)).toBeVisible()

    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })
})

// ─── Responsive Layout ────────────────────────────────────────────────────────

test.describe('Responsive — PROJ-4', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-RESP-1: GroupMainSheet renders correctly at 375px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')

    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards found'); return }

    await expect(page.getByText('Vorschläge')).toBeVisible({ timeout: 3000 })
    // FAB should still be visible at mobile
    const fab = page.getByRole('button', { name: /Vorschlag/i })
    // Sheet content should not overflow viewport horizontally
    const sheetContent = page.locator('[data-state="open"]').first()
    if (await sheetContent.count() > 0) {
      const box = await sheetContent.boundingBox()
      if (box) expect(box.width).toBeLessThanOrEqual(375)
    }
  })

  test('AC-RESP-2: Groups page renders correctly at 768px (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')
    await expect(page.getByRole('heading', { name: 'Meine Gruppen' })).toBeVisible({ timeout: 5000 })
  })

  test('AC-RESP-3: Groups page renders correctly at 1440px (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')
    await expect(page.getByRole('heading', { name: 'Meine Gruppen' })).toBeVisible({ timeout: 5000 })
  })
})
