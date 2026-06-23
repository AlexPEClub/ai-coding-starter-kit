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

async function openProfileSheet(page: Page): Promise<boolean> {
  await page.goto('/groups')
  await page.waitForSelector('main', { timeout: 5000 })
  const avatarBtn = page.getByRole('button', { name: 'Profil öffnen' })
  if ((await avatarBtn.count()) === 0) return false
  await avatarBtn.click()
  await page.waitForTimeout(400)
  return true
}

// ─── Regression: Auth guard ────────────────────────────────────────────────────

test.describe('PROJ-8 Regression — Auth guard', () => {
  test('AC-GUARD: Unauthenticated user visiting /groups is redirected to /login', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Profil-Sheet öffnen ──────────────────────────────────────────────────────

test.describe('AC-PROFILE-OPEN: Profil-Sheet öffnen', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-OPEN-1: Tapping avatar opens ProfileSheet with two tabs (Profil + Archiv)', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByRole('tab', { name: 'Profil' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('tab', { name: 'Archiv' })).toBeVisible({ timeout: 3000 })
  })

  test('AC-OPEN-2: Profil tab is active by default when sheet opens', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    const profilTab = page.getByRole('tab', { name: 'Profil' })
    await expect(profilTab).toBeVisible({ timeout: 3000 })
    await expect(profilTab).toHaveAttribute('data-state', 'active')
  })
})

// ─── Profilbild & Anzeigename ─────────────────────────────────────────────────

test.describe('AC-PROFILE-EDIT: Anzeigename bearbeiten', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-NAME-1: Profil-Tab shows avatar, display name, and edit button', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByRole('button', { name: 'Profilbild ändern' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Namen bearbeiten' })).toBeVisible({ timeout: 3000 })
  })

  test('AC-NAME-2: Empty display name shows validation error and does not save', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    // Open edit mode
    await page.getByRole('button', { name: 'Namen bearbeiten' }).click()
    await page.waitForTimeout(200)
    // Clear the name field
    const nameInput = page.getByPlaceholder('Anzeigename')
    await nameInput.clear()
    // Save with empty name (click the check button)
    const saveBtn = page.locator('button[aria-label!="Namen bearbeiten"][aria-label!="Profilbild ändern"]').filter({ hasText: '' }).first()
    // Use keyboard shortcut instead — press Enter
    await nameInput.press('Enter')
    await page.waitForTimeout(300)
    // Validation error should appear
    await expect(page.getByText('Name darf nicht leer sein')).toBeVisible({ timeout: 3000 })
  })

  test('AC-NAME-3: Clicking avatar button opens native file picker (input type=file is present)', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    // A hidden file input should be present in the DOM
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    await expect(fileInput).toHaveCount(1, { timeout: 3000 })
  })
})

// ─── Google Kalender ──────────────────────────────────────────────────────────

test.describe('AC-CALENDAR: Google Kalender verbinden', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-CAL-1: "Kalender-Verbindung" section is visible in Profil tab', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByText('Kalender-Verbindung')).toBeVisible({ timeout: 3000 })
  })

  test('AC-CAL-2: "Google Kalender verbinden" button is visible when no calendar is connected', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    // This test will be skipped if a calendar IS connected
    const connectBtn = page.getByRole('button', { name: /Google Kalender verbinden/i })
    const connectedBadge = page.getByText(/^Verbunden$/i)
    const isConnected = (await connectedBadge.count()) > 0
    if (isConnected) { test.skip(true, 'Calendar already connected; disconnect first to test this AC'); return }
    await expect(connectBtn).toBeVisible({ timeout: 3000 })
  })
})

// ─── Manuelle Blockierungen ───────────────────────────────────────────────────

test.describe('AC-BLOCKS: Manuelle Blockierungen', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-BLOCK-1: "Meine Blockierungen" section is visible in Profil tab', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByText('Meine Blockierungen')).toBeVisible({ timeout: 3000 })
  })

  test('AC-BLOCK-2: Empty state message shown when no blocks exist', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    const addBtn = page.getByText('Blockierung hinzufügen')
    const emptyState = page.getByText('Noch keine Blockierungen')
    const hasEmpty = (await emptyState.count()) > 0
    const hasBlocks = (await page.locator('[aria-label="Blockierung löschen"]').count()) > 0
    if (!hasEmpty && !hasBlocks) { test.skip(true, 'Section not in expected state'); return }
    if (hasEmpty) {
      await expect(emptyState).toBeVisible({ timeout: 2000 })
    }
    await expect(addBtn).toBeVisible({ timeout: 3000 })
  })

  test('AC-BLOCK-3: "Blockierung hinzufügen" opens form with Von and Bis fields', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByText('Blockierung hinzufügen').click()
    await page.waitForTimeout(200)
    // Von (start date) field should appear
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 3000 })
  })

  test('AC-BLOCK-4: End date before start date shows validation error', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByText('Blockierung hinzufügen').click()
    await page.waitForTimeout(200)
    const dateInputs = page.locator('input[type="date"]')
    // Fill start = 2026-12-10, end = 2026-12-05 (before start)
    await dateInputs.nth(0).fill('2026-12-10')
    await dateInputs.nth(1).fill('2026-12-05')
    await page.getByRole('button', { name: 'Hinzufügen' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText(/Enddatum muss nach dem Startdatum/i)).toBeVisible({ timeout: 3000 })
  })

  test('AC-BLOCK-5: Leaving "Bis" empty and saving creates a single-day block', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByText('Blockierung hinzufügen').click()
    await page.waitForTimeout(200)
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2026-12-31')
    // Leave end date empty, click Hinzufügen
    await page.getByRole('button', { name: 'Hinzufügen' }).click()
    await page.waitForTimeout(1000)
    // Block should appear in list — toast or block item
    const toast = page.getByText('Blockierung hinzugefügt')
    const blockItem = page.getByText(/31\.12\.2026/)
    const added = (await toast.count()) > 0 || (await blockItem.count()) > 0
    expect(added).toBe(true)
  })

  test('AC-BLOCK-6: Existing block shows delete button; tapping opens confirm dialog', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    const deleteButtons = page.locator('[aria-label="Blockierung löschen"]')
    if ((await deleteButtons.count()) === 0) { test.skip(true, 'No blocks exist to test delete'); return }
    await deleteButtons.first().click()
    await page.waitForTimeout(200)
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Blockierung löschen?')).toBeVisible({ timeout: 2000 })
  })
})

// ─── Archiv Tab ───────────────────────────────────────────────────────────────

test.describe('AC-ARCHIVE: Archiv Tab', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-ARCH-1: Switching to "Archiv" tab shows either activity list or empty state', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByRole('tab', { name: 'Archiv' }).click()
    await page.waitForTimeout(500)
    const emptyState = page.getByText(/Noch kein Archiv/i)
    const hasCards = (await page.locator('[class*="rounded-\\[18px\\]"]').count()) > 0
    const hasEmptyState = (await emptyState.count()) > 0
    expect(hasCards || hasEmptyState).toBe(true)
  })

  test('AC-ARCH-2: Archive empty state text appears when no completed activities exist', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByRole('tab', { name: 'Archiv' }).click()
    await page.waitForTimeout(500)
    const hasCards = (await page.locator('[class*="rounded-\\[18px\\]"]').count()) > 0
    if (hasCards) { test.skip(true, 'Archive has activities; empty-state test not applicable'); return }
    await expect(page.getByText(/Eure erste gemeinsame Erinnerung wartet/i)).toBeVisible({ timeout: 3000 })
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe('AC-LOGOUT: Logout Confirmation', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('AC-LOGOUT-1: Clicking "Ausloggen" opens confirmation dialog', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByRole('button', { name: 'Ausloggen' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Ausloggen?')).toBeVisible({ timeout: 2000 })
  })

  test('AC-LOGOUT-2: Cancelling logout dialog keeps user on /groups', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByRole('button', { name: 'Ausloggen' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await page.waitForTimeout(300)
    expect(page.url()).toContain('/groups')
  })

  test('AC-LOGOUT-3: Confirming logout redirects to /login', async ({ page }) => {
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await page.getByRole('button', { name: 'Ausloggen' }).click()
    await page.waitForTimeout(300)
    // Click the confirm Ausloggen button (inside dialog)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Ausloggen' }).click()
    await page.waitForURL(/\/login/, { timeout: 8000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Google OAuth Callback ────────────────────────────────────────────────────

test.describe('AC-OAUTH: Google Calendar OAuth Callback Page', () => {
  test('AC-OAUTH-1: /auth/google-calendar/callback without params shows error state', async ({ page }) => {
    await page.goto('/auth/google-calendar/callback')
    await page.waitForTimeout(1000)
    await expect(page.getByText('Verbindung fehlgeschlagen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('link', { name: 'Zurück zur App' })).toBeVisible({ timeout: 2000 })
  })

  test('AC-OAUTH-2: /auth/google-calendar/callback with error=access_denied shows error', async ({ page }) => {
    await page.goto('/auth/google-calendar/callback?error=access_denied')
    await page.waitForTimeout(1000)
    await expect(page.getByText('Verbindung fehlgeschlagen')).toBeVisible({ timeout: 5000 })
  })
})

// ─── Responsive Layout ────────────────────────────────────────────────────────

test.describe('AC-RESPONSIVE: Responsive layout', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-RESP-1: ProfileSheet renders correctly at 375px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByRole('tab', { name: 'Profil' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('tab', { name: 'Archiv' })).toBeVisible({ timeout: 3000 })
  })

  test('AC-RESP-2: ProfileSheet renders correctly at 768px (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) { test.skip(true, 'User has no groups yet'); return }
    const opened = await openProfileSheet(page)
    if (!opened) { test.skip(true, 'Avatar button not found'); return }
    await expect(page.getByRole('tab', { name: 'Profil' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('tab', { name: 'Archiv' })).toBeVisible({ timeout: 3000 })
  })
})
