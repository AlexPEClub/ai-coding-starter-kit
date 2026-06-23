import { test, expect } from '@playwright/test'

// ─── Auth Guard ───────────────────────────────────────────────────────────────

test.describe('Auth Guard', () => {
  test('AC-GUARD-1: Unauthenticated user visiting "/" is redirected to /login', async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
    await page.goto('/')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Login Page ───────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 5000 })
  })

  test('AC-LOGIN-1: Shows email, password fields and disabled OAuth placeholder buttons', async ({ page }) => {
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Einloggen', exact: true })).toBeVisible()

    // OAuth placeholder buttons are visible but disabled
    const googleBtn = page.getByRole('button', { name: /Google/i })
    const appleBtn = page.getByRole('button', { name: /Apple/i })
    const facebookBtn = page.getByRole('button', { name: /Facebook/i })

    await expect(googleBtn).toBeVisible()
    await expect(appleBtn).toBeVisible()
    await expect(facebookBtn).toBeVisible()

    await expect(googleBtn).toBeDisabled()
    await expect(appleBtn).toBeDisabled()
    await expect(facebookBtn).toBeDisabled()
  })

  test('AC-LOGIN-2: Wrong credentials show generic error (no field disambiguation)', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('wrong@example.com')
    await page.getByLabel('Passwort').fill('wrongpassword')
    await page.getByRole('button', { name: 'Einloggen', exact: true }).click()

    await expect(page.getByText('E-Mail oder Passwort falsch')).toBeVisible({ timeout: 8000 })
  })

  test('AC-LOGIN-3: "Passwort vergessen" link navigates to /forgot-password', async ({ page }) => {
    await page.getByRole('link', { name: /Passwort vergessen/i }).click()
    await page.waitForURL(/\/forgot-password/, { timeout: 5000 })
    expect(page.url()).toContain('/forgot-password')
  })

  test('AC-LOGIN-4: "Registrieren" link navigates to /signup', async ({ page }) => {
    await page.getByRole('link', { name: /Registrieren/i }).click()
    await page.waitForURL(/\/signup/, { timeout: 5000 })
    expect(page.url()).toContain('/signup')
  })
})

// ─── Signup Page ──────────────────────────────────────────────────────────────

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => localStorage.clear())
    await page.goto('/signup')
    await page.waitForSelector('form', { timeout: 5000 })
  })

  test('AC-SIGNUP-1: Shows all required fields (Anzeigename, E-Mail, Passwort, AGB)', async ({ page }) => {
    await expect(page.getByLabel('Anzeigename')).toBeVisible()
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Registrieren' })).toBeVisible()
  })

  test('AC-SIGNUP-VAL-1: Empty display name shows validation error', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('test@example.com')
    await page.getByLabel('Passwort').fill('passwort123')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Registrieren' }).click()

    await expect(page.getByText('Anzeigename ist erforderlich')).toBeVisible({ timeout: 3000 })
  })

  test('AC-SIGNUP-VAL-2: Invalid email shows validation error', async ({ page }) => {
    await page.getByLabel('Anzeigename').fill('Max')
    await page.getByLabel('E-Mail').fill('kein-email')
    await page.getByLabel('Passwort').fill('passwort123')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Registrieren' }).click()

    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible({ timeout: 3000 })
  })

  test('AC-SIGNUP-VAL-3: Password shorter than 8 chars shows validation error', async ({ page }) => {
    await page.getByLabel('Anzeigename').fill('Max')
    await page.getByLabel('E-Mail').fill('max@example.com')
    await page.getByLabel('Passwort').fill('kurz')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Registrieren' }).click()

    await expect(page.getByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeVisible({ timeout: 3000 })
  })

  test('AC-SIGNUP-VAL-4: Unchecked AGB shows validation error', async ({ page }) => {
    await page.getByLabel('Anzeigename').fill('Max')
    await page.getByLabel('E-Mail').fill('max@example.com')
    await page.getByLabel('Passwort').fill('passwort123')
    // AGB NOT checked
    await page.getByRole('button', { name: 'Registrieren' }).click()

    await expect(page.getByText('Bitte akzeptiere die AGB und Datenschutzerklärung')).toBeVisible({ timeout: 3000 })
  })

  test('AC-SIGNUP-LINK: "Einloggen" link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: /Einloggen/i }).click()
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

// ─── Signup Pending Page ──────────────────────────────────────────────────────

test.describe('Signup Pending Screen', () => {
  test('AC-PENDING-1: Shows confirmation message with email and action buttons', async ({ page }) => {
    const testEmail = 'test@example.com'
    await page.goto(`/signup/pending?email=${encodeURIComponent(testEmail)}`)

    await expect(page.getByText('Bestätigungs-Mail gesendet')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(testEmail)).toBeVisible()
    await expect(page.getByRole('button', { name: /Mail erneut senden/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Andere E-Mail-Adresse verwenden/i })).toBeVisible()
  })

  test('AC-PENDING-2: "Andere E-Mail-Adresse verwenden" links back to /signup', async ({ page }) => {
    await page.goto('/signup/pending?email=test%40example.com')
    await page.getByRole('link', { name: /Andere E-Mail-Adresse verwenden/i }).click()
    await page.waitForURL(/\/signup/, { timeout: 5000 })
    expect(page.url()).toContain('/signup')
  })
})

// ─── Forgot Password Page ─────────────────────────────────────────────────────

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForSelector('form', { timeout: 5000 })
  })

  test('AC-FORGOT-1: Shows email field and submit button', async ({ page }) => {
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByRole('button', { name: /Reset-Link senden/i })).toBeVisible()
  })

  test('AC-FORGOT-2: Invalid email in forgot-password shows validation error', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('kein-email')
    await page.getByRole('button', { name: /Reset-Link senden/i }).click()
    await expect(page.getByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeVisible({ timeout: 3000 })
  })

  test('AC-FORGOT-3: Submit with valid email shows user-enumeration-safe confirmation', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('irgendwer@example.com')
    await page.getByRole('button', { name: /Reset-Link senden/i }).click()

    // Always shows the same message (no user enumeration)
    await expect(page.getByText(/Falls diese Adresse registriert ist/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─── Reset Password Page ──────────────────────────────────────────────────────

test.describe('Reset Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reset-password')
    await page.waitForSelector('form', { timeout: 5000 })
  })

  test('AC-RESET-1: Shows new password and confirm password fields', async ({ page }) => {
    await expect(page.getByLabel('Neues Passwort')).toBeVisible()
    await expect(page.getByLabel('Passwort bestätigen')).toBeVisible()
    await expect(page.getByRole('button', { name: /Passwort ändern/i })).toBeVisible()
  })

  test('AC-RESET-VAL-1: Password shorter than 8 chars shows error', async ({ page }) => {
    await page.getByLabel('Neues Passwort').fill('kurz')
    await page.getByLabel('Passwort bestätigen').fill('kurz')
    await page.getByRole('button', { name: /Passwort ändern/i }).click()

    await expect(page.getByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeVisible({ timeout: 3000 })
  })

  test('AC-RESET-VAL-2: Mismatching passwords show error', async ({ page }) => {
    await page.getByLabel('Neues Passwort').fill('neues1234')
    await page.getByLabel('Passwort bestätigen').fill('anderes456')
    await page.getByRole('button', { name: /Passwort ändern/i }).click()

    await expect(page.getByText('Passwörter stimmen nicht überein')).toBeVisible({ timeout: 3000 })
  })
})

// ─── Responsive Layout ────────────────────────────────────────────────────────

test.describe('Responsive Layout', () => {
  test('Login page renders correctly at 375px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 5000 })

    // Form should be visible and not overflow
    const form = page.locator('form')
    await expect(form).toBeVisible()
    const box = await form.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })

  test('Login page renders correctly at 1440px (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 5000 })
    await expect(page.locator('form')).toBeVisible()
  })
})
