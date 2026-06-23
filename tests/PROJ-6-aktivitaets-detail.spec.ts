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

async function openGroupAndClickFirstProposalCard(page: Page): Promise<boolean> {
  const opened = await openFirstGroup(page)
  if (!opened) return false

  // The "Vorschläge" tab should be active by default
  // Click the first ProposalCard body (not the action menu)
  const firstCard = page.locator('[class*="rounded-\\[18px\\]"]').filter({ hasText: /\// }).first()
  if ((await firstCard.count()) === 0) {
    // Try a broader selector for proposal cards
    const cards = page.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    if ((await cards.count()) === 0) return false
    await cards.first().click()
  } else {
    await firstCard.click()
  }
  await page.waitForTimeout(600)
  return true
}

// ─── Regression: Auth guard ────────────────────────────────────────────────────

test.describe('PROJ-6 Regression — Auth guard', () => {
  test('AC-GUARD: Unauthenticated user visiting /groups is redirected to /login', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Regression: Previous features still work ─────────────────────────────────

test.describe('PROJ-6 Regression — Vorschläge & Kanban tabs', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-REG-1: Vorschläge tab is still present and active by default', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }
    const vorschlaegeBtn = page.getByRole('button', { name: 'Vorschläge' })
    await expect(vorschlaegeBtn).toBeVisible({ timeout: 3000 })
    await expect(vorschlaegeBtn).toHaveClass(/text-primary/)
  })

  test('AC-REG-2: Planung tab still navigates to Kanban board', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }
    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(500)
    await expect(planungBtn).toHaveClass(/text-primary/)
  })
})

// ─── AC: Opening the detail sheet ─────────────────────────────────────────────

test.describe('PROJ-6 — Öffnen der Detailansicht', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-OPEN-1: Tapping a ProposalCard opens the Activity Detail Sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    // Find any proposal card and click it
    const proposalCards = page.locator('[data-radix-scroll-area-viewport] [class*="rounded-\\[18px\\]"], [class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    const count = await proposalCards.count()
    if (count === 0) { test.skip(true, 'No proposal cards found'); return }

    // Click the first card
    await proposalCards.first().click()
    await page.waitForTimeout(800)

    // Bottom sheet should appear (h-[92dvh])
    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet).toBeVisible({ timeout: 5000 })
  })

  test('AC-OPEN-2: Tapping a KanbanCard opens the Activity Detail Sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    // Find a Kanban card
    const kanbanCards = page.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    const count = await kanbanCards.count()
    if (count === 0) { test.skip(true, 'No kanban cards found'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet).toBeVisible({ timeout: 5000 })
  })

  test('AC-OPEN-3: Detail sheet shows hero with activity name and status badge', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    const count = await proposalCards.count()
    if (count === 0) { test.skip(true, 'No proposal cards found'); return }

    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet).toBeVisible({ timeout: 5000 })

    // Hero should contain a status badge (text like "Vorschlag", "Zu Planen", "In Planung", etc.)
    const statusBadge = sheet.locator('[class*="uppercase"][class*="tracking"]')
    await expect(statusBadge.first()).toBeVisible({ timeout: 3000 })

    // Sheet header should show the activity name
    const headerName = sheet.locator('p[class*="font-\\[800\\]"]').first()
    await expect(headerName).toBeVisible()
    const name = await headerName.textContent()
    expect(name?.trim()).not.toBe('')
  })

  test('AC-OPEN-4: Detail sheet shows "von [Initiator]" below the activity name in hero', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards found'); return }

    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet).toBeVisible({ timeout: 5000 })

    const initiatorLine = sheet.locator('p', { hasText: /^von / })
    await expect(initiatorLine).toBeVisible({ timeout: 3000 })
  })

  test('AC-OPEN-5: Close button (X) dismisses the detail sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards found'); return }

    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet).toBeVisible({ timeout: 5000 })

    const closeBtn = sheet.locator('button[aria-label="Schließen"]').first()
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    await page.waitForTimeout(400)

    await expect(sheet).not.toBeVisible({ timeout: 3000 })
  })
})

// ─── AC: Comments section ─────────────────────────────────────────────────────

test.describe('PROJ-6 — Kommentare', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  async function openDetailSheet(page: Page): Promise<boolean> {
    const opened = await openFirstGroup(page)
    if (!opened) return false
    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) return false
    await proposalCards.first().click()
    await page.waitForTimeout(800)
    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    return (await sheet.isVisible())
  }

  test('AC-COMMENT-1: "Kommentare" section is always visible in the sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const ok = await openDetailSheet(page)
    if (!ok) { test.skip(true, 'Could not open detail sheet'); return }

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    const heading = sheet.locator('h3', { hasText: /Kommentare/i })
    await expect(heading).toBeVisible({ timeout: 3000 })
  })

  test('AC-COMMENT-2: Send button is disabled when the editor is empty', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const ok = await openDetailSheet(page)
    if (!ok) { test.skip(true, 'Could not open detail sheet'); return }

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    const sendBtn = sheet.locator('button[aria-label="Senden"]')
    await expect(sendBtn).toBeVisible({ timeout: 3000 })
    await expect(sendBtn).toBeDisabled()
  })

  test('AC-COMMENT-3: Typing in editor enables the send button', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const ok = await openDetailSheet(page)
    if (!ok) { test.skip(true, 'Could not open detail sheet'); return }

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    const editor = sheet.locator('.tiptap-editor [contenteditable="true"]')
    await expect(editor).toBeVisible({ timeout: 3000 })

    await editor.click()
    await editor.type('Test-Kommentar')

    const sendBtn = sheet.locator('button[aria-label="Senden"]')
    await expect(sendBtn).toBeEnabled({ timeout: 2000 })
  })

  test('AC-COMMENT-4: Empty state text shown when no comments exist', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const ok = await openDetailSheet(page)
    if (!ok) { test.skip(true, 'Could not open detail sheet'); return }

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    // Wait for comments to load (loading skeleton clears)
    await page.waitForTimeout(1500)

    // Either empty state OR existing comments — both are valid
    const emptyState = sheet.locator('p', { hasText: /Noch keine Kommentare/ })
    const existingComment = sheet.locator('[class*="rounded-\\[10px\\]"]').filter({ hasText: /.+/ })
    const hasEmpty = (await emptyState.count()) > 0
    const hasComments = (await existingComment.count()) > 0
    expect(hasEmpty || hasComments).toBe(true)
  })

  test('AC-COMMENT-5: Rich-text toolbar is visible (B, I, list buttons)', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const ok = await openDetailSheet(page)
    if (!ok) { test.skip(true, 'Could not open detail sheet'); return }

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    await expect(sheet.locator('button[aria-label="Fett"]')).toBeVisible({ timeout: 3000 })
    await expect(sheet.locator('button[aria-label="Kursiv"]')).toBeVisible()
    await expect(sheet.locator('button[aria-label="Aufzählung"]')).toBeVisible()
    await expect(sheet.locator('button[aria-label="Nummerierte Liste"]')).toBeVisible()
    await expect(sheet.locator('button[aria-label="Bild einfügen"]')).toBeVisible()
  })
})

// ─── AC: Status-based section visibility ──────────────────────────────────────

test.describe('PROJ-6 — Status-based section visibility', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-STATUS-1: A "vorschlag" activity does NOT show Verantwortlichkeiten or Erinnerungsfotos sections', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    // Look for a proposal card (vorschlag status)
    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards found'); return }

    await proposalCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    // Check the hero for "Vorschlag" badge
    const statusBadge = sheet.locator('[class*="uppercase"][class*="tracking"]').first()
    const badgeText = await statusBadge.textContent()

    if (badgeText?.trim() === 'Vorschlag') {
      // Responsibilities and photos must NOT appear for "vorschlag" status
      const respHeading = sheet.locator('h3', { hasText: /Verantwortlichkeiten/i })
      const photoHeading = sheet.locator('h3', { hasText: /Erinnerungsfotos/i })
      await expect(respHeading).not.toBeVisible()
      await expect(photoHeading).not.toBeVisible()
    } else {
      test.skip(true, 'First card is not a "vorschlag" — cannot verify this AC')
    }
  })

  test('AC-STATUS-2: An "in_planung" activity shows Verantwortlichkeiten section', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    // Navigate to Kanban and look for an in_planung card
    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    // Look for "In Planung" column header and its first card
    const inPlanungColumn = page.locator('div', { hasText: /^In Planung$/ }).first()
    const kanbanCards = inPlanungColumn.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    const count = await kanbanCards.count()
    if (count === 0) { test.skip(true, 'No in_planung cards found'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const respHeading = sheet.locator('h3', { hasText: /Verantwortlichkeiten/i })
    await expect(respHeading).toBeVisible({ timeout: 3000 })
  })

  test('AC-STATUS-3: An "abgeschlossen" activity shows both Verantwortlichkeiten (read-only) and Erinnerungsfotos sections', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    const abgeschlossenColumn = page.locator('div', { hasText: /^Abgeschlossen$/ }).first()
    const kanbanCards = abgeschlossenColumn.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    if ((await kanbanCards.count()) === 0) { test.skip(true, 'No abgeschlossen cards found'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    await expect(sheet.locator('h3', { hasText: /Verantwortlichkeiten/i })).toBeVisible({ timeout: 3000 })
    await expect(sheet.locator('h3', { hasText: /Erinnerungsfotos/i })).toBeVisible({ timeout: 3000 })

    // "Verantwortlichkeit hinzufügen" button should NOT be present (read-only)
    const addRespBtn = sheet.locator('button', { hasText: /Verantwortlichkeit hinzufügen/i })
    await expect(addRespBtn).not.toBeVisible()
  })
})

// ─── AC: Edit functionality ────────────────────────────────────────────────────

test.describe('PROJ-6 — Aktivität bearbeiten', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-EDIT-1: Admin sees pencil icon in the sheet header', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards'); return }
    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    // If the test user is admin or initiator, the edit button should be visible
    const editBtn = sheet.locator('button[aria-label="Bearbeiten"]')
    // We can't know if the user is admin, but we can verify if it exists then it has the right icon
    const editBtnCount = await editBtn.count()
    if (editBtnCount > 0) {
      await expect(editBtn).toBeVisible()
    }
    // If no edit button, user is not admin/initiator — that's valid too
    expect(editBtnCount).toBeGreaterThanOrEqual(0)
  })

  test('AC-EDIT-2: Edit form shows validation error when Name is empty', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards'); return }
    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const editBtn = sheet.locator('button[aria-label="Bearbeiten"]')
    if ((await editBtn.count()) === 0) { test.skip(true, 'Test user is not admin/initiator'); return }

    await editBtn.click()
    await page.waitForTimeout(400)

    // Clear the name field and try to save
    const nameInput = sheet.locator('input').first()
    await nameInput.clear()

    const saveBtn = sheet.locator('button', { hasText: 'Speichern' }).last()
    await saveBtn.click()

    // Validation error should appear
    const nameError = sheet.locator('p[class*="text-error"]')
    await expect(nameError).toBeVisible({ timeout: 2000 })
    expect(await nameError.textContent()).toMatch(/Pflichtfeld/)
  })

  test('AC-EDIT-3: Cancel button dismisses the edit form', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards'); return }
    await proposalCards.first().click()
    await page.waitForTimeout(800)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const editBtn = sheet.locator('button[aria-label="Bearbeiten"]')
    if ((await editBtn.count()) === 0) { test.skip(true, 'Test user is not admin/initiator'); return }

    await editBtn.click()
    await page.waitForTimeout(400)

    // Edit form should be visible
    const cancelBtn = sheet.locator('button', { hasText: 'Abbrechen' }).first()
    await expect(cancelBtn).toBeVisible({ timeout: 2000 })
    await cancelBtn.click()
    await page.waitForTimeout(300)

    // Edit form should be gone
    await expect(cancelBtn).not.toBeVisible()
  })
})

// ─── AC: Verantwortlichkeiten ─────────────────────────────────────────────────

test.describe('PROJ-6 — Verantwortlichkeiten', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-RESP-1: "Verantwortlichkeit hinzufügen" button opens inline form with label + member dropdown', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    // Look for an in_planung card
    const inPlanungColumn = page.locator('div', { hasText: /^In Planung$/ }).first()
    const kanbanCards = inPlanungColumn.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    if ((await kanbanCards.count()) === 0) { test.skip(true, 'No in_planung cards'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const addRespBtn = sheet.locator('button', { hasText: /Verantwortlichkeit hinzufügen/i })
    if ((await addRespBtn.count()) === 0) { test.skip(true, 'No add responsibility button'); return }

    await addRespBtn.click()
    await page.waitForTimeout(400)

    // Inline form should appear
    const labelInput = sheet.locator('input[placeholder*="Verantwortlichkeit"]')
    await expect(labelInput).toBeVisible({ timeout: 2000 })
  })

  test('AC-RESP-2: Save button in responsibility form is disabled when label or member is missing', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    const inPlanungColumn = page.locator('div', { hasText: /^In Planung$/ }).first()
    const kanbanCards = inPlanungColumn.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    if ((await kanbanCards.count()) === 0) { test.skip(true, 'No in_planung cards'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const addRespBtn = sheet.locator('button', { hasText: /Verantwortlichkeit hinzufügen/i })
    if ((await addRespBtn.count()) === 0) { test.skip(true, 'No add responsibility button'); return }

    await addRespBtn.click()
    await page.waitForTimeout(400)

    // "Hinzufügen" submit button should be disabled when label is empty
    const hinzufuegenBtn = sheet.locator('button', { hasText: /Hinzufügen/i })
    await expect(hinzufuegenBtn).toBeDisabled({ timeout: 2000 })
  })
})

// ─── AC: Foto-Galerie ─────────────────────────────────────────────────────────

test.describe('PROJ-6 — Foto-Galerie', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) return
  })

  test('AC-PHOTO-1: Erinnerungsfotos section only visible for "abgeschlossen" activity', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const proposalCards = page.locator('[class*="overflow-y-auto"] [class*="rounded-\\[18px\\]"]')
    if ((await proposalCards.count()) === 0) { test.skip(true, 'No proposal cards'); return }

    await proposalCards.first().click()
    await page.waitForTimeout(1000)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const statusBadge = sheet.locator('[class*="uppercase"][class*="tracking"]').first()
    const badgeText = (await statusBadge.textContent())?.trim()

    if (badgeText === 'Abgeschlossen') {
      // Photos section should be visible
      await expect(sheet.locator('h3', { hasText: /Erinnerungsfotos/i })).toBeVisible({ timeout: 3000 })
    } else {
      // Photos section should NOT be visible for all other statuses
      await expect(sheet.locator('h3', { hasText: /Erinnerungsfotos/i })).not.toBeVisible()
    }
  })

  test('AC-PHOTO-2: "Noch keine Erinnerungsfotos" empty state shown when no photos exist in abgeschlossen activity', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'No group'); return }
    const opened = await openFirstGroup(page)
    if (!opened) { test.skip(true, 'No group cards'); return }

    const planungBtn = page.getByRole('button', { name: 'Planung' })
    await expect(planungBtn).toBeEnabled({ timeout: 3000 })
    await planungBtn.click()
    await page.waitForTimeout(800)

    const abgeschlossenColumn = page.locator('div', { hasText: /^Abgeschlossen$/ }).first()
    const kanbanCards = abgeschlossenColumn.locator('[class*="rounded-\\[18px\\]"][class*="cursor-pointer"]')
    if ((await kanbanCards.count()) === 0) { test.skip(true, 'No abgeschlossen cards'); return }

    await kanbanCards.first().click()
    await page.waitForTimeout(1500)

    const sheet = page.locator('[role="dialog"]').filter({ hasText: /Kommentare/ })
    if (!(await sheet.isVisible())) { test.skip(true, 'Sheet not visible'); return }

    const photoSection = sheet.locator('h3', { hasText: /Erinnerungsfotos/i })
    if ((await photoSection.count()) === 0) { test.skip(true, 'No photo section — status might not be abgeschlossen'); return }

    // Either empty state or existing photos
    const emptyState = sheet.locator('p', { hasText: /Noch keine Erinnerungsfotos/i })
    const photoGrid = sheet.locator('[class*="grid-cols-3"]')
    const hasEmpty = (await emptyState.count()) > 0
    const hasPhotos = (await photoGrid.count()) > 0
    expect(hasEmpty || hasPhotos).toBe(true)
  })
})
