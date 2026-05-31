import { test, expect, type Page } from '@playwright/test'

// Authenticated tests require a real test user.
// Set these in .env.test.local (never commit credentials).
const TEST_EMAIL    = process.env.TEST_USER_EMAIL    ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

// ---------------------------------------------------------------------------
// REGISTRIERUNG -- Formular-Validierung
// ---------------------------------------------------------------------------

test.describe('Registrierung - Validierung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('zeigt Validierungsfehler fuer alle Pflichtfelder bei leerem Submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Praxis anlegen' }).click()
    await expect(page.getByText('Praxisname ist erforderlich')).toBeVisible()
    await expect(page.getByText('Vorname ist erforderlich')).toBeVisible()
    await expect(page.getByText('Nachname ist erforderlich')).toBeVisible()
    await expect(page.getByText('E-Mail ist erforderlich')).toBeVisible()
    await expect(page.getByText('Passwort muss mindestens 8 Zeichen haben')).toBeVisible()
  })

  test('zeigt Fehler bei Passwort kuerzer als 8 Zeichen', async ({ page }) => {
    await page.getByLabel('Passwort').fill('1234567')
    await page.getByRole('button', { name: 'Praxis anlegen' }).click()
    await expect(page.getByText('Passwort muss mindestens 8 Zeichen haben')).toBeVisible()
  })

  test('akzeptiert Passwort mit genau 8 Zeichen kein Fehler', async ({ page }) => {
    await page.getByLabel('Passwort').fill('12345678')
    await page.getByRole('button', { name: 'Praxis anlegen' }).click()
    await expect(page.getByText('Passwort muss mindestens 8 Zeichen haben')).not.toBeVisible()
  })

  test('zeigt Fehler bei ungueltigem E-Mail-Format', async ({ page }) => {
    // 'test@invalid' passes browser HTML5 email validation (has @)
    // but fails the Zod refine regex which requires a dot in the domain.
    await page.getByLabel('E-Mail').fill('test@invalid')
    await page.getByRole('button', { name: 'Praxis anlegen' }).click()
    await expect(page.getByText('Gültige E-Mail-Adresse eingeben')).toBeVisible()
  })

  test('enthaelt Link zur Login-Seite', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', '/login')
  })
})

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('zeigt generische Fehlermeldung bei falschen Zugangsdaten', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('falsch@example.com')
    await page.getByLabel('Passwort').fill('FalschesPasswort123')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page.getByText('E-Mail oder Passwort ist falsch')).toBeVisible()
  })

  test('Fehlermeldung ist generisch und gibt keinen Hinweis auf das falsche Feld', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('existiert-nicht@example.com')
    await page.getByLabel('Passwort').fill('IrgendinPasswort1!')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // Error must be the exact generic message -- no field-specific hints
    await expect(page.getByText('E-Mail oder Passwort ist falsch')).toBeVisible()
    await expect(page.getByText('Diese E-Mail ist nicht registriert')).not.toBeVisible()
    await expect(page.getByText('Das Passwort ist falsch')).not.toBeVisible()
  })

  test('enthaelt Passwort vergessen Link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Passwort vergessen?' })).toHaveAttribute('href', '/forgot-password')
  })

  test('enthaelt Link zur Registrierung', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Jetzt registrieren' })).toHaveAttribute('href', '/register')
  })
})

// ---------------------------------------------------------------------------
// ROUTING & SCHUTZMECHANISMEN
// ---------------------------------------------------------------------------

test.describe('Route-Schutz', () => {
  test('leitet unauthentifizierten Nutzer von /dashboard zur Login-Seite um', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('leitet unauthentifizierten Nutzer von /settings/profile zur Login-Seite um', async ({ page }) => {
    await page.goto('/settings/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('leitet unauthentifizierten Nutzer von /patients zur Login-Seite um', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Login-URL enthaelt next-Parameter mit der urspruenglichen URL', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/next=%2Fpatients/)
  })
})

// ---------------------------------------------------------------------------
// PASSWORT VERGESSEN
// ---------------------------------------------------------------------------

test.describe('Passwort vergessen', () => {
  test('zeigt Erfolgsmeldung ohne zu verraten ob E-Mail existiert kein Account-Enumeration', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('E-Mail').fill('existiert-nicht@beispiel.de')
    await page.getByRole('button', { name: 'Reset-Link senden' }).click()
    await expect(page.getByText('E-Mail gesendet')).toBeVisible()
    await expect(page.getByText('Falls ein Konto mit dieser E-Mail-Adresse existiert')).toBeVisible()
  })

  test('zeigt Validierungsfehler bei ungueltigem E-Mail-Format', async ({ page }) => {
    await page.goto('/forgot-password')
    // 'test@invalid' passes browser HTML5 validation but fails Zod .email() (no TLD)
    await page.getByLabel('E-Mail').fill('test@invalid')
    await page.getByRole('button', { name: 'Reset-Link senden' }).click()
    await expect(page.getByText('Gültige E-Mail-Adresse eingeben')).toBeVisible()
  })

  test('enthaelt Link zurueck zur Anmeldung', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('link', { name: /Zurück zur Anmeldung/ })).toHaveAttribute('href', '/login')
  })
})

// ---------------------------------------------------------------------------
// AUTHENTIFIZIERTE FLOWS (benoetigen TEST_USER_EMAIL + TEST_USER_PASSWORD)
// ---------------------------------------------------------------------------

test.describe('Eingeloggter Therapeut - App-Shell', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('Dashboard ist nach Login erreichbar', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('Sidebar enthaelt alle Navigationspunkte', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Patienten' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Termine' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Übungen' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Trainingspläne' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeVisible()
  })

  test('Dashboard zeigt Willkommensnachricht', async ({ page }) => {
    await expect(page.getByText(/Willkommen/)).toBeVisible()
  })

  test('eingeloggter Nutzer wird von /login zum Dashboard weitergeleitet', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('eingeloggter Nutzer wird von /register zum Dashboard weitergeleitet', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Eingeloggter Therapeut - Profil-Einstellungen', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/settings/profile')
  })

  test('Profil-Seite laedt und zeigt Formularfelder', async ({ page }) => {
    await expect(page.getByLabel('Vorname')).toBeVisible()
    await expect(page.getByLabel('Nachname')).toBeVisible()
    await expect(page.getByLabel(/Telefon/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bild ändern' })).toBeVisible()
  })

  test('zeigt Validierungsfehler wenn Vorname geleert wird', async ({ page }) => {
    await page.getByLabel('Vorname').fill('')
    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(page.getByText('Vorname ist erforderlich')).toBeVisible()
  })

  test('zeigt Validierungsfehler wenn Nachname geleert wird', async ({ page }) => {
    await page.getByLabel('Nachname').fill('')
    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(page.getByText('Nachname ist erforderlich')).toBeVisible()
  })
})

test.describe('Eingeloggter Therapeut - Logout', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test('Logout beendet Session und leitet zur Login-Seite', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.locator('aside').getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /Abmelden/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
