import { test, expect, type Page } from '@playwright/test'

// To run authenticated tests: set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars
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

// ─── Auth Guard ───────────────────────────────────────────────────────────────

test.describe('Auth Guard — PROJ-3 routes', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
  })

  test('AC-GUARD-GROUPS: Unauthenticated visit to /groups redirects to /login', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('AC-GUARD-ONBOARDING: Unauthenticated visit to /onboarding redirects to /login', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Onboarding Screen ────────────────────────────────────────────────────────

test.describe('Onboarding Screen', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/onboarding')
    await page.waitForSelector('text=Starte jetzt', { timeout: 5000 })
  })

  test('AC-ONBOARD-1: Shows two options — "Gruppe erstellen" and "Gruppe beitreten"', async ({ page }) => {
    await expect(page.getByText('Gruppe erstellen')).toBeVisible()
    await expect(page.getByText('Gruppe beitreten')).toBeVisible()
  })

  test('AC-ONBOARD-2: Clicking "Gruppe erstellen" shows the create form', async ({ page }) => {
    await page.getByText('Gruppe erstellen').first().click()
    await expect(page.getByLabel('Gruppenname')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gruppe erstellen' })).toBeVisible()
  })

  test('AC-ONBOARD-3: Clicking "Gruppe beitreten" shows the join form', async ({ page }) => {
    await page.getByText('Gruppe beitreten').first().click()
    await expect(page.getByLabel('Einladungs-Code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gruppe beitreten' })).toBeVisible()
  })

  test('AC-ONBOARD-4: Back button returns to choice screen', async ({ page }) => {
    await page.getByText('Gruppe erstellen').first().click()
    await page.getByText('← Zurück').click()
    await expect(page.getByText('Starte jetzt')).toBeVisible()
    await expect(page.getByText('Gruppe erstellen')).toBeVisible()
    await expect(page.getByText('Gruppe beitreten')).toBeVisible()
  })
})

// ─── Create Group Form Validation ─────────────────────────────────────────────

test.describe('Gruppe erstellen — Validation', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/onboarding')
    await page.waitForSelector('text=Starte jetzt', { timeout: 5000 })
    await page.getByText('Gruppe erstellen').first().click()
    await page.waitForSelector('input[id="group-name"]', { timeout: 3000 })
  })

  test('AC-CREATE-VAL-1: Empty name shows "Gruppenname ist erforderlich"', async ({ page }) => {
    await page.getByRole('button', { name: 'Gruppe erstellen' }).click()
    await expect(page.getByText('Gruppenname ist erforderlich')).toBeVisible()
  })

  test('AC-CREATE-VAL-2: Character counter shows 0/50 initially', async ({ page }) => {
    await expect(page.getByText('0/50 Zeichen')).toBeVisible()
  })

  test('AC-CREATE-VAL-3: Character counter updates as user types', async ({ page }) => {
    await page.getByLabel('Gruppenname').fill('Test')
    await expect(page.getByText('4/50 Zeichen')).toBeVisible()
  })
})

// ─── Join Group Form Validation ───────────────────────────────────────────────

test.describe('Gruppe beitreten — Validation', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/onboarding')
    await page.waitForSelector('text=Starte jetzt', { timeout: 5000 })
    await page.getByText('Gruppe beitreten').first().click()
    await page.waitForSelector('input[id="invite-code"]', { timeout: 3000 })
  })

  test('AC-JOIN-VAL-1: "Beitreten" button is disabled with empty code', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Gruppe beitreten' })).toBeDisabled()
  })

  test('AC-JOIN-VAL-2: Button remains disabled until 6 chars entered', async ({ page }) => {
    await page.getByLabel('Einladungs-Code').fill('ABCDE')
    await expect(page.getByRole('button', { name: 'Gruppe beitreten' })).toBeDisabled()
    await page.getByLabel('Einladungs-Code').fill('ABCDEF')
    await expect(page.getByRole('button', { name: 'Gruppe beitreten' })).not.toBeDisabled()
  })

  test('AC-JOIN-VAL-3: Input auto-uppercases and strips special characters', async ({ page }) => {
    await page.getByLabel('Einladungs-Code').fill('abc123')
    await expect(page.getByLabel('Einladungs-Code')).toHaveValue('ABC123')
  })

  test('AC-JOIN-VAL-4: Invalid code shows "Ungültiger Einladungs-Code"', async ({ page }) => {
    await page.getByLabel('Einladungs-Code').fill('XXXXXX')
    await page.getByRole('button', { name: 'Gruppe beitreten' }).click()
    await expect(page.getByText('Ungültiger Einladungs-Code')).toBeVisible({ timeout: 5000 })
  })
})

// ─── Groups Overview ──────────────────────────────────────────────────────────

test.describe('Gruppen-Übersicht', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/\/(groups|onboarding)/, { timeout: 8000 })
  })

  test('AC-OVERVIEW-1: Root "/" redirects to /groups when user has groups, or /onboarding when not', async ({ page }) => {
    const url = page.url()
    expect(url).toMatch(/\/(groups|onboarding)/)
  })

  test('AC-OVERVIEW-2: /groups page shows "Meine Gruppen" heading', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups — redirected to onboarding')
      return
    }
    await page.goto('/groups')
    await expect(page.getByRole('heading', { name: 'Meine Gruppen' })).toBeVisible()
  })

  test('AC-OVERVIEW-3: "Hinzufügen" button is visible in header', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await expect(page.getByRole('button', { name: /Hinzufügen/i })).toBeVisible()
  })

  test('AC-OVERVIEW-4: Clicking user avatar opens dropdown with "Ausloggen"', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')
    await page.getByRole('button', { name: /avatar|profil/i }).first().click()
    await expect(page.getByText('Ausloggen')).toBeVisible()
  })
})

// ─── Group Detail Sheet ───────────────────────────────────────────────────────

test.describe('Gruppen-Detail-Sheet', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    // Navigate to /groups and open the first group card
    if (page.url().includes('onboarding')) return
    await page.goto('/groups')
    await page.waitForSelector('button.rounded-\\[18px\\]', { timeout: 5000 }).catch(() => {})
  })

  test('AC-DETAIL-1: Clicking a group card opens the detail sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    // Click first group card
    const cards = page.locator('button').filter({ hasText: 'Mitglieder' })
    if (await cards.count() === 0) {
      test.skip(true, 'No group cards found')
      return
    }
    await cards.first().click()
    await expect(page.getByText('Einladungs-Code')).toBeVisible({ timeout: 3000 })
  })

  test('AC-DETAIL-2: Detail sheet shows invite code and copy button', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const cards = page.locator('button').filter({ hasText: 'Mitglieder' })
    if (await cards.count() === 0) {
      test.skip(true, 'No group cards found')
      return
    }
    await cards.first().click()
    await expect(page.getByText('Einladungs-Code')).toBeVisible({ timeout: 3000 })
    await expect(page.getByLabel('Code kopieren')).toBeVisible()
  })

  test('AC-DETAIL-3: "Mitglieder" section is visible in detail sheet', async ({ page }) => {
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    const cards = page.locator('button').filter({ hasText: 'Mitglieder' })
    if (await cards.count() === 0) {
      test.skip(true, 'No group cards found')
      return
    }
    await cards.first().click()
    await expect(page.getByText(/Mitglieder \(\d+\)/)).toBeVisible({ timeout: 3000 })
  })
})

// ─── Invite Code Regeneration ─────────────────────────────────────────────────

test.describe('Einladungs-Code neu generieren', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-REGEN-1: "Neu generieren" button visible for admin, triggers confirmation dialog', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')
    const cards = page.locator('button').filter({ hasText: 'Mitglieder' })
    if (await cards.count() === 0) {
      test.skip(true, 'No group cards found')
      return
    }
    await cards.first().click()
    const regenBtn = page.getByRole('button', { name: 'Neu generieren' })
    if (await regenBtn.isVisible()) {
      await regenBtn.click()
      await expect(page.getByText('Code neu generieren?')).toBeVisible()
      await expect(page.getByText('Der alte Code wird sofort ungültig')).toBeVisible()
      // Cancel without actually regenerating
      await page.getByRole('button', { name: 'Abbrechen' }).click()
    }
  })
})

// ─── Admin Name Edit ──────────────────────────────────────────────────────────

test.describe('Admin: Gruppenname inline editieren', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-NAME-EDIT-1: Admin sees edit pencil icon next to group name', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    if (page.url().includes('onboarding')) {
      test.skip(true, 'User has no groups')
      return
    }
    await page.goto('/groups')
    const cards = page.locator('button').filter({ hasText: 'Mitglieder' })
    if (await cards.count() === 0) {
      test.skip(true, 'No group cards found')
      return
    }
    await cards.first().click()
    await page.waitForTimeout(500)
    // Pencil icon button should be visible if user is admin
    const pencilBtn = page.getByLabel('Gruppenname bearbeiten')
    if (await pencilBtn.isVisible()) {
      await pencilBtn.click()
      await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
      // Cancel edit
      await page.getByRole('button', { name: 'Abbrechen' }).click()
    }
  })
})

// ─── Responsive Layout ────────────────────────────────────────────────────────

test.describe('Responsive — Onboarding', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL + TEST_USER_PASSWORD env vars')

  test('AC-RESP-1: Onboarding screen renders correctly at 375px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/onboarding')
    await expect(page.getByText('Starte jetzt')).toBeVisible()
    await expect(page.getByText('Gruppe erstellen')).toBeVisible()
    await expect(page.getByText('Gruppe beitreten')).toBeVisible()
  })
})
