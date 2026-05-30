import { describe, it, expect } from 'vitest'
import { generateSlug } from './generate-slug'

// These tests mirror the SQL slug logic in handle_new_user() (001_initial_schema.sql).
// If the SQL logic changes, update both the SQL and this file together.

describe('generateSlug', () => {
  describe('basic normalisation', () => {
    it('lowercases the input', () => {
      expect(generateSlug('Tierphysio München')).toBe('tierphysio-muenchen')
    })

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('Meine Praxis')).toBe('meine-praxis')
    })

    it('collapses multiple spaces into a single hyphen', () => {
      expect(generateSlug('Meine   Praxis')).toBe('meine-praxis')
    })

    it('strips leading and trailing whitespace', () => {
      expect(generateSlug('  Tierphysio  ')).toBe('tierphysio')
    })

    it('preserves existing hyphens', () => {
      expect(generateSlug('Böse-Straße Praxis')).toBe('boese-strasse-praxis')
    })

    it('collapses multiple consecutive hyphens', () => {
      expect(generateSlug('Hunde---Katzen Physio')).toBe('hunde-katzen-physio')
    })
  })

  describe('German umlaut normalisation (edge case from spec)', () => {
    it('converts ä → ae', () => {
      expect(generateSlug('Hände')).toBe('haende')
    })

    it('converts ö → oe', () => {
      expect(generateSlug('Höfe')).toBe('hoefe')
    })

    it('converts ü → ue', () => {
      expect(generateSlug('Müller')).toBe('mueller')
    })

    it('converts ß → ss', () => {
      expect(generateSlug('Straße')).toBe('strasse')
    })

    it('handles uppercase umlauts (lowercased first)', () => {
      expect(generateSlug('MÜLLER')).toBe('mueller')
      expect(generateSlug('PFERDEPRAXIS BÖSE-STRASSE')).toBe('pferdepraxis-boese-strasse')
    })

    it('handles the spec example: "Müller & Partner Tierphysio GmbH"', () => {
      expect(generateSlug('Müller & Partner Tierphysio GmbH')).toBe(
        'mueller-partner-tierphysio-gmbh'
      )
    })
  })

  describe('special character stripping', () => {
    it('strips & character', () => {
      expect(generateSlug('Hunde & Katzen')).toBe('hunde-katzen')
    })

    it('strips parentheses', () => {
      expect(generateSlug('Praxis (Mitte)')).toBe('praxis-mitte')
    })

    it('strips dots and commas', () => {
      expect(generateSlug('Dr. Müller, Tierphysio')).toBe('dr-mueller-tierphysio')
    })

    it('strips exclamation marks and other punctuation', () => {
      expect(generateSlug('Top! Tierphysio GmbH.')).toBe('top-tierphysio-gmbh')
    })

    it('strips forward slashes', () => {
      expect(generateSlug('Physio / Reha Tiere')).toBe('physio-reha-tiere')
    })

    it('handles the spec example: "Tierphysio München"', () => {
      expect(generateSlug('Tierphysio München')).toBe('tierphysio-muenchen')
    })
  })

  describe('empty / degenerate input (edge case from spec)', () => {
    it('returns "praxis" for an empty string', () => {
      expect(generateSlug('')).toBe('praxis')
    })

    it('returns "praxis" for whitespace-only input', () => {
      expect(generateSlug('   ')).toBe('praxis')
    })

    it('returns "praxis" when all characters are stripped', () => {
      // Only special characters, nothing left after stripping
      expect(generateSlug('!!! @@@ ###')).toBe('praxis')
    })
  })

  describe('numbers and alphanumeric', () => {
    it('preserves digits', () => {
      expect(generateSlug('Praxis 24')).toBe('praxis-24')
    })

    it('handles alphanumeric names without spaces', () => {
      expect(generateSlug('TierPhysio2025')).toBe('tierphysio2025')
    })
  })
})
