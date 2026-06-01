import { test, expect, type Page } from '@playwright/test'

// Authenticated CRUD tests require a real test user with an existing workspace.
// Set these in .env.test.local (never commit credentials).
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

// A SECOND account in a DIFFERENT practice/tenant — required only for the
// cross-tenant isolation test. Set TEST_USER2_EMAIL / TEST_USER2_PASSWORD.
const TEST_EMAIL2 = process.env.TEST_USER2_EMAIL ?? ''
const TEST_PASSWORD2 = process.env.TEST_USER2_PASSWORD ?? ''

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

async function openCreateForm(page: Page) {
  await page.goto('/patients')
  await page.getByRole('button', { name: 'Neuer Patient' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

// ---------------------------------------------------------------------------
// ROUTE-SCHUTZ (laeuft ohne Login)
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Route-Schutz', () => {
  test('leitet unauthentifizierten Nutzer von der Patientenliste zum Login um', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/\/login/)
  })

  test('leitet unauthentifizierten Nutzer von einer Patienten-Detailseite zum Login um', async ({ page }) => {
    await page.goto('/patients/00000000-0000-4000-8000-000000000000')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Login-URL enthaelt next-Parameter mit der Patienten-Detail-URL', async ({ page }) => {
    await page.goto('/patients/00000000-0000-4000-8000-000000000000')
    await expect(page).toHaveURL(/next=%2Fpatients/)
  })
})

// ---------------------------------------------------------------------------
// PATIENTENLISTE (eingeloggt)
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Patientenliste', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/patients')
  })

  test('zeigt Kopfzeile, Suchfeld, Status-Tabs und Neuer-Patient-Button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Patienten' })).toBeVisible()
    await expect(page.getByPlaceholder(/suchen/i)).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Aktiv' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Archiviert' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Neuer Patient' })).toBeVisible()
  })

  test('Suche ohne Treffer zeigt "Kein Patient gefunden"', async ({ page }) => {
    await page.getByPlaceholder(/suchen/i).fill('zzz-kein-treffer-xyz')
    await expect(page.getByText('Kein Patient gefunden')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// PATIENT ANLEGEN -- Validierung (eingeloggt)
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Patient anlegen - Validierung', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('zeigt Validierungsfehler fuer Pflichtfelder bei leerem Submit', async ({ page }) => {
    await openCreateForm(page)
    await page.getByRole('button', { name: 'Patient anlegen' }).click()
    await expect(page.getByText('Tiername ist erforderlich')).toBeVisible()
    await expect(page.getByText('Tierart ist erforderlich')).toBeVisible()
  })

  test('neuer Besitzer ohne E-Mail und Telefon zeigt Kontakt-Fehler', async ({ page }) => {
    await openCreateForm(page)
    await page.getByLabel('Tiername').fill('Testtier')
    await page.getByText('Neuen Besitzer anlegen').click()
    await page.getByLabel('Vorname').fill('Anna')
    await page.getByLabel('Nachname').fill('Beispiel')
    await page.getByRole('button', { name: 'Patient anlegen' }).click()
    // exact:true → trifft die Validierungs-FormMessage, nicht den statischen
    // Hinweistext darunter (der mit Punkt endet).
    await expect(
      page.getByText('Mindestens E-Mail oder Telefon ist erforderlich', { exact: true }),
    ).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// PATIENT-LEBENSZYKLUS: anlegen -> Detailseite -> archivieren -> reaktivieren
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Patient Lebenszyklus', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test('legt einen Patienten mit neuem Besitzer an und oeffnet die Detailseite', async ({ page }) => {
    const tierName = `QA-Hund-${Date.now()}`
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await openCreateForm(page)

    await page.getByLabel('Tiername').fill(tierName)
    // Tierart (Radix Select)
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Hund' }).click()
    // Neuer Besitzer
    await page.getByText('Neuen Besitzer anlegen').click()
    await page.getByLabel('Vorname').fill('Anna')
    await page.getByLabel('Nachname').fill('Beispiel')
    await page.getByLabel('E-Mail').fill(`anna+${Date.now()}@example.com`)

    await page.getByRole('button', { name: 'Patient anlegen' }).click()

    // Detailseite mit Tiername + Platzhalter-Sektionen. Auf den Hauptbereich
    // scopen, da die Sidebar ebenfalls "Termine"/"Trainingspläne" enthält.
    const main = page.getByRole('main')
    await expect(page.getByRole('heading', { name: tierName })).toBeVisible()
    await expect(main.getByText('Tierdaten')).toBeVisible()
    await expect(main.getByText('Anamnese / Notizen')).toBeVisible()
    await expect(main.getByText('Termine')).toBeVisible()
    await expect(main.getByText('Trainingspläne')).toBeVisible()
  })

  test('archivieren verlangt Bestaetigung und entfernt den Patienten aus der aktiven Liste', async ({ page }) => {
    const tierName = `QA-Archiv-${Date.now()}`
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await openCreateForm(page)
    await page.getByLabel('Tiername').fill(tierName)
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Katze' }).click()
    await page.getByText('Neuen Besitzer anlegen').click()
    await page.getByLabel('Vorname').fill('Max')
    await page.getByLabel('Nachname').fill('Mustermann')
    await page.getByLabel('Telefon').fill('+49 89 123456')
    await page.getByRole('button', { name: 'Patient anlegen' }).click()
    await expect(page.getByRole('heading', { name: tierName })).toBeVisible()

    // Archivieren -> Bestaetigungsdialog (Confirm-Button im Dialog scopen,
    // da der Trigger-Button denselben Namen traegt)
    await page.getByRole('button', { name: 'Archivieren' }).click()
    const archiveDialog = page.getByRole('alertdialog')
    await expect(archiveDialog).toBeVisible()
    await archiveDialog.getByRole('button', { name: 'Archivieren' }).click()

    // Status-Badge wechselt auf Archiviert, Reaktivieren erscheint
    await expect(page.getByText('Archiviert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reaktivieren' })).toBeVisible()

    // In der aktiven Liste nicht mehr sichtbar
    await page.goto('/patients')
    await page.getByPlaceholder(/suchen/i).fill(tierName)
    await expect(page.getByText('Kein Patient gefunden')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// BESITZER bearbeiten -- Validierung (eingeloggt)
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Besitzer bearbeiten - Validierung', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test('Besitzer mit leerer E-Mail und Telefon zeigt Kontakt-Fehler', async ({ page }) => {
    const tierName = `QA-Owner-${Date.now()}`
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await openCreateForm(page)
    await page.getByLabel('Tiername').fill(tierName)
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Hund' }).click()
    await page.getByText('Neuen Besitzer anlegen').click()
    await page.getByLabel('Vorname').fill('Eva')
    await page.getByLabel('Nachname').fill('Test')
    await page.getByLabel('E-Mail').fill(`eva+${Date.now()}@example.com`)
    await page.getByRole('button', { name: 'Patient anlegen' }).click()
    await expect(page.getByRole('heading', { name: tierName })).toBeVisible()

    // Besitzer bearbeiten -> beide Kontaktfelder leeren -> Fehler
    await page.getByRole('button', { name: 'Bearbeiten' }).last().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('E-Mail').fill('')
    await page.getByLabel('Telefon').fill('')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Mindestens E-Mail oder Telefon ist erforderlich')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// CROSS-TENANT ISOLATION (benoetigt zweiten Account in anderer Praxis)
// Erfolgskriterium: Tenant B darf Patienten von Tenant A nicht lesen/aendern.
// ---------------------------------------------------------------------------

test.describe('PROJ-3 Mandanten-Isolation', () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD || !TEST_EMAIL2 || !TEST_PASSWORD2,
    'TEST_USER_* und TEST_USER2_* (zweiter Account) erforderlich',
  )

  test('Tenant B kann einen Patienten von Tenant A weder lesen noch aendern', async ({ browser }) => {
    // --- Tenant A: Patient anlegen, ID aus der Detail-URL holen ---
    const ctxA = await browser.newContext()
    const pageA = await ctxA.newPage()
    const tierName = `QA-ISO-${Date.now()}`
    await loginAs(pageA, TEST_EMAIL, TEST_PASSWORD)
    await openCreateForm(pageA)
    await pageA.getByLabel('Tiername').fill(tierName)
    await pageA.getByRole('combobox').first().click()
    await pageA.getByRole('option', { name: 'Hund' }).click()
    await pageA.getByText('Neuen Besitzer anlegen').click()
    await pageA.getByLabel('Vorname').fill('Iso')
    await pageA.getByLabel('Nachname').fill('Tenant-A')
    await pageA.getByLabel('E-Mail').fill(`iso+${Date.now()}@example.com`)
    await pageA.getByRole('button', { name: 'Patient anlegen' }).click()
    await pageA.waitForURL(/\/patients\/[0-9a-f-]{36}$/, { timeout: 10_000 })
    const patientId = pageA.url().split('/patients/')[1]

    // --- Tenant B: separater Kontext, fremder Patient ---
    const ctxB = await browser.newContext()
    const pageB = await ctxB.newPage()
    await loginAs(pageB, TEST_EMAIL2, TEST_PASSWORD2)

    // API: GET muss 404 liefern (RLS verbirgt fremden Tenant)
    const getRes = await pageB.request.get(`/api/patients/${patientId}`)
    expect(getRes.status()).toBe(404)

    // API: PATCH (z. B. archivieren) muss 404 liefern (kein Cross-Tenant-Write)
    const patchRes = await pageB.request.patch(`/api/patients/${patientId}`, {
      data: { status: 'archived' },
    })
    expect(patchRes.status()).toBe(404)

    // UI: Detailseite zeigt "Patient nicht gefunden"
    await pageB.goto(`/patients/${patientId}`)
    await expect(pageB.getByText('Patient nicht gefunden')).toBeVisible()

    // Gegenprobe: Tenant A sieht seinen Patienten weiterhin
    const getResA = await pageA.request.get(`/api/patients/${patientId}`)
    expect(getResA.status()).toBe(200)

    await ctxA.close()
    await ctxB.close()
  })
})
