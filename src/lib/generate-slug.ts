/**
 * TypeScript mirror of the SQL slug generation logic in handle_new_user().
 * Used to preview slugs in the registration form (PROJ-2) and for unit testing
 * the same normalisation rules applied by the database trigger.
 *
 * This function must stay in sync with the slug logic in:
 *   supabase/migrations/001_initial_schema.sql → handle_new_user()
 */
export function generateSlug(practiceName: string): string {
  let slug = (practiceName ?? '').trim()

  if (!slug) return 'praxis'

  slug = slug.toLowerCase()

  // German umlaut normalisation (must happen before stripping non-ASCII)
  slug = slug.replace(/ä/g, 'ae')
  slug = slug.replace(/ö/g, 'oe')
  slug = slug.replace(/ü/g, 'ue')
  slug = slug.replace(/ß/g, 'ss')

  // Strip everything that is not a-z, 0-9, space, or hyphen
  slug = slug.replace(/[^a-z0-9 -]/g, '')

  // Collapse whitespace → single hyphen
  slug = slug.trim().replace(/\s+/g, '-')

  // Collapse multiple consecutive hyphens
  slug = slug.replace(/-{2,}/g, '-')

  // Trim leading / trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '')

  return slug || 'praxis'
}
