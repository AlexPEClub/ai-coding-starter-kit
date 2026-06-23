import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Replicated schemas from the auth components for isolated testing
const signupSchema = z.object({
  displayName: z.string().min(1, 'Anzeigename ist erforderlich'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  agb: z.boolean().refine((val) => val === true, {
    message: 'Bitte akzeptiere die AGB und Datenschutzerklärung',
  }),
})

const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

const forgotSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

const resetSchema = z
  .object({
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  })

describe('SignupForm validation', () => {
  const validData = {
    displayName: 'Max Mustermann',
    email: 'max@example.com',
    password: 'sicher123',
    agb: true,
  }

  it('accepts valid signup data', () => {
    expect(signupSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects empty display name', () => {
    const result = signupSchema.safeParse({ ...validData, displayName: '' })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.displayName).toContain('Anzeigename ist erforderlich')
  })

  it('rejects invalid email format', () => {
    const result = signupSchema.safeParse({ ...validData, email: 'kein-email' })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.email).toContain('Bitte gib eine gültige E-Mail-Adresse ein')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({ ...validData, password: 'kurz' })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.password).toContain('Passwort muss mindestens 8 Zeichen lang sein')
  })

  it('accepts password with exactly 8 characters', () => {
    const result = signupSchema.safeParse({ ...validData, password: '12345678' })
    expect(result.success).toBe(true)
  })

  it('rejects unchecked AGB checkbox', () => {
    const result = signupSchema.safeParse({ ...validData, agb: false })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.agb).toContain('Bitte akzeptiere die AGB und Datenschutzerklärung')
  })
})

describe('LoginForm validation', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'geheim' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'kein-email', password: 'geheim' })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.email).toContain('Bitte gib eine gültige E-Mail-Adresse ein')
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    const err = result.error?.flatten().fieldErrors
    expect(err?.password).toContain('Passwort ist erforderlich')
  })
})

describe('ForgotPasswordForm validation', () => {
  it('accepts valid email', () => {
    expect(forgotSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = forgotSchema.safeParse({ email: 'kein-email' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toContain(
      'Bitte gib eine gültige E-Mail-Adresse ein'
    )
  })
})

describe('ResetPasswordForm validation', () => {
  it('accepts matching passwords with min length', () => {
    const result = resetSchema.safeParse({ password: 'neues123', confirmPassword: 'neues123' })
    expect(result.success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = resetSchema.safeParse({ password: 'kurz', confirmPassword: 'kurz' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.password).toContain(
      'Passwort muss mindestens 8 Zeichen lang sein'
    )
  })

  it('rejects mismatching passwords', () => {
    const result = resetSchema.safeParse({ password: 'neues1234', confirmPassword: 'anders456' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.confirmPassword).toContain(
      'Passwörter stimmen nicht überein'
    )
  })

  it('accepts password with exactly 8 characters when they match', () => {
    const result = resetSchema.safeParse({ password: '12345678', confirmPassword: '12345678' })
    expect(result.success).toBe(true)
  })
})
