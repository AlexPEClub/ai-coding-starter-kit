# PROJ-2: User Login

## Status: 🔵 Planned

## User Stories
- Als registrierter User möchte ich mich mit Email und Passwort einloggen um auf mein Konto zuzugreifen
- Als User möchte ich OAuth-Login benutzen um schnellen Zugang ohne Passwort zu haben
- Als Security-Admin möchte ich Rate Limiting um Brute-Force-Angriffe zu verhindern
- Als User möchte ich "Remember Me" wählen um Session-Persistenz zu kontrollieren

## Acceptance Criteria
- [ ] User kann sich mit Email und Passwort einloggen
- [ ] OAuth-Login verfügbar für Google und GitHub
- [ ] "Remember Me" Checkbox für Session-Persistenz
- [ ] User kann nur einloggen wenn Email verifiziert ist
- [ ] Klare Fehlermeldungen bei falschen Credentials
- [ ] Rate Limiting: 5 Login-Versuche pro Email pro Minute
- [ ] Session Token wird nach erfolgreichem Login erstellt
- [ ] User wird nach Login zum Dashboard weitergeleitet
- [ ] Bei Remember Me = true: Session hält 30 Tage
- [ ] Bei Remember Me = false: Session hält bis Browser-Close

## Edge Cases
- **Falsche Credentials**: "Email oder Passwort falsch" (nicht spezifisch welcher)
- **Unverifizierte Email**: "Bitte verifiziere deine Email vor dem Login"
- **Rate Limit Exceeded**: "Zu viele Versuche. Bitte warten 5 Minuten."
- **Session Expired**: Automatischer Redirect zu Login mit "Session abgelaufen"
- **OAuth-Fehler**: Graceful Fallback auf Email/Passwort Login
- **Account Disabled**: "Account wurde deaktiviert. Bitte kontaktiere Support"
- **Browser Back Button**: Verhindert Cached Login-Seite nach Logout

## Technische Anforderungen
- **Performance**: < 200ms Response Time für Login
- **Security**: Secure HTTP-only Cookies, SameSite=Strict
- **Session**: JWT mit expiration, refresh token mechanism
- **OAuth**: NextAuth.js oder Supabase Auth Integration
- **Rate Limiting**: Redis oder In-Memory Storage

## Dependencies
- Benötigt: PROJ-1 (User Registration) - für User-Existenz
- Benötigt: PROJ-3 (Session Management) - für Session Handling

## File Location
/src/app/(auth)/login/page.tsx
/src/app/api/auth/login/route.ts

## Tech-Design (Solution Architect)

### Component-Struktur
Login Page
├── Page Layout mit Background und Branding
├── Login Form Container
│   ├── Form Title und Welcome Message
│   ├── Email Input Field
│   │   ├── Email Format Validation
│   │   └── Autofill Support
│   ├── Password Input Field
│   │   ├── Show/Hide Password Toggle
│   │   └── Caps Lock Warning
│   ├── Remember Me Checkbox
│   │   ├── Session Duration Erklärung
│   │   └── Browser Compatibility Info
│   ├── Submit Button mit Loading State
│   ├── Form Error Messages
│   └── Success Redirect Handler
├── OAuth Provider Section
│   ├── Divider ("oder einloggen mit")
│   ├── Google OAuth Button
│   │   ├── Google Icon
│   │   └── Loading State
│   └── GitHub OAuth Button
│       ├── GitHub Icon
│       └── Loading State
├── Account Recovery Section
│   ├── "Passwort vergessen?" Link
│   └── Noch kein Konto? Registrieren Link
└── Session Status Checker
    ├── Automatic Redirect bei aktiver Session
    └── Session Expired Notice

### Daten-Model
Login Process generiert:
- Session Record mit User ID
- Access Token (JWT, 15 Minuten gültig)
- Refresh Token (Rotation enabled)
- Device Information
- IP Address bei Login
- User Agent String
- Login Timestamp
- Session Type (remember_me oder session)

Session Security Metadata:
- Failed Login Attempts Counter
- Last Successful Login Timestamp
- Lockout Status bei zu vielen Versuchen
- Two-Factor Setup Status (future)

### Tech-Entscheidungen
Warum JWT mit Refresh Tokens?
→ Stateless für schnelle Validierung
→ Kurze Access Token Lebensdauer für Security
→ Refresh Token Rotation gegen Theft
→ Cross-Device Session Management
→ Standardisiert und Mobile-freundlich

Warum "Remember Me" Option?
→ User Control über Session Dauer
→ Balance zwischen Security und Convenience
→ 30 Tage für typische User Habits
→ Compliance mit Privacy Requirements

Warum Rate Limiting pro Email?
→ Fokussierter Schutz gegen Brute-Force
→ Prevents Email Enumeration Attacks
→ Fair für legitime User mit Fehlversuchen
→ Redis-basiert für Distributed Systems

Warum Session Validation im Middleware?
→ Zentraler Schutz für alle Routes
→ Performance-Optimiert mit Edge Runtime
→ Automatic Token Refresh
→ Graceful Redirect bei Session Issues

### Dependencies
Benötigte Packages:
- @supabase/auth-js (Session Management)
- jsonwebtoken (JWT Creation/Validation)
- jose (JWT Refresh Handling)
- react-hook-form (Form Management)
- @hookform/resolvers (Validation)
- sonner (Toast Notifications)
- js-cookie (Cookie Management)
- @types/js-cookie (TypeScript Support)

Security Dependencies:
- express-rate-limit (Rate Limiting)
- helmet (Security Headers)
- bcryptjs (Password Verification)
- crypto-random-string (CSRF Tokens)

### Integration Patterns
Auth State Management:
→ React Context mit Session Provider
→ Local Storage für Access Tokens
→ HTTP-Only Cookies für Refresh Tokens
→ Automatic Token Refresh auf API Calls

Form Validation:
→ Client-seitige Validierung für UX
→ Server-seitige Verification für Security
→ Unified Error Messages für Consistency
→ Progressive Enhancement

Session Persistence:
→ Cookie-basiert mit httpOnly und secure
→ SameSite=Strict für CSRF Protection
→ Automatic Expiration Handling
→ Cross-Tab Synchronization

OAuth Integration:
→ Supabase Auth Provider Hooks
→ Custom Redirect Handling
→ Error Recovery für OAuth Failures
→ Account Linking mit existing Users

### Performance Considerations
Login Response Time:
→ Database Indexes für Email Lookups
→ Connection Pooling für High Load
→ Cached Session Validation
→ Edge Middleware für schnelle Checks

Token Refresh Strategy:
→ Sliding Expiration für User Experience
→ Background Refresh ohne UI Disruption
→ Fallback für Network Issues
→ Atomic Token Rotation

Security Optimizations:
→ Bcrypt mit constant-time comparison
→ CSRF Token Rotation pro Request
→ Rate Limiting mit Sliding Window
→ Failed Login Attempt Tracking

Mobile Optimizations:
→ Touch-friendly Button Sizes
── Keyboard Navigation Support
── Autofill Integration
── Progressive Web App Compatibility