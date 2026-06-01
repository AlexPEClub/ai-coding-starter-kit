import { describe, it, expect } from 'vitest'
import { formatAge, sexLabel, nameInitials, SPECIES_PRESETS } from './patient-options'

describe('formatAge', () => {
  const now = new Date('2026-06-01T12:00:00Z')

  it('returns null for empty or invalid input', () => {
    expect(formatAge(null, now)).toBeNull()
    expect(formatAge(undefined, now)).toBeNull()
    expect(formatAge('not-a-date', now)).toBeNull()
  })

  it('returns null for a future birth date', () => {
    expect(formatAge('2030-01-01', now)).toBeNull()
  })

  it('formats whole years (singular and plural)', () => {
    expect(formatAge('2025-06-01', now)).toBe('1 Jahr')
    expect(formatAge('2023-06-01', now)).toBe('3 Jahre')
  })

  it('formats months for animals under a year', () => {
    expect(formatAge('2026-01-01', now)).toBe('5 Monate')
    expect(formatAge('2026-05-01', now)).toBe('1 Monat')
  })

  it('formats days for very young animals', () => {
    expect(formatAge('2026-05-21', now)).toBe('11 Tage')
    expect(formatAge('2026-05-31', now)).toBe('1 Tag')
  })
})

describe('sexLabel', () => {
  it('maps known values to German labels', () => {
    expect(sexLabel('male')).toBe('Männlich')
    expect(sexLabel('female_spayed')).toBe('Weiblich (kastriert)')
  })

  it('falls back to a dash for null/unknown', () => {
    expect(sexLabel(null)).toBe('—')
    expect(sexLabel(undefined)).toBe('—')
  })
})

describe('nameInitials', () => {
  it('takes up to two initials, uppercased', () => {
    expect(nameInitials('Max Mustermann')).toBe('MM')
    expect(nameInitials('bello')).toBe('B')
    expect(nameInitials('  ')).toBe('?')
  })
})

describe('SPECIES_PRESETS', () => {
  it('includes the common species', () => {
    expect(SPECIES_PRESETS).toContain('Hund')
    expect(SPECIES_PRESETS).toContain('Katze')
    expect(SPECIES_PRESETS).toContain('Pferd')
  })
})
