# PROJ-1: User Registration

## Status: 🔵 Planned

## User Stories
- Als neuer User möchte ich mich mit Email und Passwort registrieren um ein Konto zu erstellen
- als Product Manager möchte ich sichere Passwort-Anforderungen um User-Daten zu schützen
- Als Developer möchte ich OAuth-Integrationen um Registrierung zu vereinfachen
- Als System möchte ich Email-Verifikation um sicherzustellen dass User echt sind

## Acceptance Criteria
- [ ] User kann mit Email und Passwort registrieren
- [ ] Passwort-Anforderungen: Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
- [ ] OAuth-Registrierung verfügbar für Google und GitHub
- [ ] User erhält Verifizierungs-Email nach Registrierung
- [ ] User kann erst einloggen nach Email-Verifizierung
- [ ] Validierung ob Email bereits registriert ist
- [ ] User-Friendly Fehlermeldungen bei ungültigen Eingaben
- [ ] CSRF-Schutz für alle Formulare
- [ ] Rate Limiting: 5 Registrierungsversuche pro IP pro Minute

## Edge Cases
- **Doppelte Email-Registrierung**: Zeigt Error Message "Email bereits verwendet"
- **Schwaches Passwort**: Zeigt spezifische Anforderungen für starkes Passwort
- **Ungültige Email**: Validiert Email-Format vor Absendung
- **OAuth-Fehler**: Graceful Fehlerbehandlung wenn OAuth-Provider nicht antwortet
- **Email-Service Down**: Zeigt freundliche Nachricht über Verzögerung bei Verifikation
- **Rate Limit Exceeded**: CAPTCHA nach 5 Fehlversuchen pro Minute
- **CSRF-Attacken**: Automatische Ablehnung bei fehlendem/gültigem Token

## Technische Anforderungen
- **Performance**: < 300ms Response Time für Registrierung
- **Security**: HTTPS only, bcrypt für Passwort-Hashing
- **Database**: Supabase PostgreSQL für User-Storage
- **Email**: Supabase Auth Email Service für Verifikation
- **Frontend**: Next.js 16 mit shadcn/ui Komponenten

## Dependencies
- Benötigt: Supabase Setup (infrastructure)

## File Location
/src/app/(auth)/register/page.tsx
/src/app/api/auth/register/route.ts

## Tech-Design (Solution Architect)

### Component-Struktur
Registration Page
├── Page Layout mit Background und Branding
├── Registration Form Container
│   ├── Form Title und Description
│   ├── Email Input Field
│   │   ├── Email Validation (Format + Unique Check)
│   │   └── Real-time Validation Feedback
│   ├── Password Input Field
│   │   ├── Password Strength Indicator
│   │   ├── Show/Hide Password Toggle
│   │   └── Requirements Checklist
│   ├── Password Confirmation Field
│   │   ├── Match Validation
│   │   └── Real-time Feedback
│   ├── Terms & Conditions Checkbox
│   │   ├── Link zu Privacy Policy
│   │   └── Required Validation
│   ├── Submit Button mit Loading State
│   └── Form Error/Success Messages
├── OAuth Provider Section
│   ├── Divider ("oder anmelden mit")
│   ├── Google OAuth Button
│   │   ├── Google Icon
│   │   └── Loading State
│   └── GitHub OAuth Button
│       ├── GitHub Icon
│       └── Loading State
├── Login Redirect Link
│   └── "Bereits ein Konto? Einloggen"
└── Verification Notice Overlay
    └── "Email Verification gesendet"

### Daten-Model
Neue User Records enthalten:
- Primary Key: User ID (UUID von Supabase)
- Email Adresse (unique, not null)
- Passwort Hash (bcrypt, 12 rounds)
- Email Verified Flag (initial false)
- Account Status (pending_verification)
- OAuth Provider Fields (null für Email/Password)
- Registration Source (email oder oauth)
- Created At Timestamp
- IP Address bei Registration
- User Agent String

Email Verification Records:
- Temporary Verification Token (UUID)
- User ID Reference
- Expiration Time (24 Stunden)
- Sent At Timestamp
- Delivery Status

### Tech-Entscheidungen
Warum Client-seitige Validierung?
→ Sofortiges Feedback für bessere UX
→ Reduziert Server Load durch vorgefilterte Requests
→ Progressive Enhancement für Accessibility
→ React Hook Form Integration für Konsistenz

Warum bcrypt mit 12 rounds?
→ Balances Security und Performance
→ Industry Standard für Production
→ Adaptive für zukünftige Hardware
→ Widerstand gegen Brute-Force

Warum OAuth Flow mit Supabase?
→ Provider-Abstraktion für多种OAuth
→ Built-in Security für Client Secrets
→ Standardisiertes Redirect Handling
→ Automatic Account Mapping

Warum Email Verification bevor Login?
→ Verhindert Fake-Accounts mit Spam-Emails
→ GDPR-Konformität für Verifizierte Identität
→ Reduziert Support-Aufwand
→ Basis für weitere Communications

### Dependencies
Benötigte Packages:
- @supabase/auth-ui-react (OAuth UI Components)
- react-hook-form (Form Management)
- @hookform/resolvers mit zod (Validation Schema)
- zod (Type-safe Validation)
- sonner (Toast Notifications)
- lucide-react (Icons für OAuth Provider)
- @types/bcryptjs (TypeScript Support)

Validierung Dependencies:
- zod-mail (Email Format Validation)
- zod-password (Password Stärke Regeln)
- @hookform/devtools (Development Tools)

### Integration Patterns
Form Integration:
→ React Hook Form mit Zod Schema Validierung
→ Optimistic UI Updates für Loading States
→ Server-Aktion mit Fehlerbehandlung
→ Success Redirect zu Verification Notice

OAuth Integration:
→ Supabase Auth UI React Components
→ Custom Styling mit shadcn/ui Design
→ Error Boundary für OAuth Failures
→ Graceful Fallback zu Email Registration

Security Integration:
→ CSRF Tokens für alle Form Submissions
→ Rate Limiting pro IP Adresse
→ XSS Protection mit Content Security Policy
→ Input Sanitization für alle Fields

Backend Integration:
→ API Route mit Supabase Client
→ Error Handling für Duplicate Emails
→ Transaction-safe User Creation
→ Async Email Versand mit Retry

### Performance Considerations
Email Validation Check:
→ Debounced API Calls nach 500ms Typing Pause
→ Client-seitige Format Validierung zuerst
→ Server-seitige Unique Check nur bei validem Format
→ Cache für schon geprüfte Emails

Password Strength Calculation:
→ Client-seitige Berechnung für sofortiges Feedback
→ Zod Integration für Pattern Matching
→ Visual Feedback mit Progress Bar
→ Accessibility mit Screen Reader Support

OAuth Loading States:
→ Per-Provider Loading Indicators
→ Timeout Handling für langsame OAuth
→ Cancel Button für User Control
→ Graceful Error Recovery