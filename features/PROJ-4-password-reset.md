# PROJ-4: Password Reset

## Status: 🔵 Planned

## User Stories
- Als User möchte ich mein Passwort zurücksetzen können wenn ich es vergessen habe
- Als Security-Admin möchte ich Passwort-Reset-Links zeitlich begrenzen um Sicherheit zu gewährleisten
- Als User möchte ich Benachrichtigung über Passwort-Änderungen um über Konto-Aktivitäten informiert zu sein
- Als Developer möchte ich sichere Token-Generierung um Reset-Prozess zu schützen

## Acceptance Criteria
- [ ] User kann Passwort-Reset über Email anfordern
- [ ] Reset-Link wird per Email gesendet mit einmaligem Token
- [ ] Reset-Link ist 15 Minuten gültig
- [ ] User kann neues Passwort über Reset-Seite setzen
- [ ] Passwort-Stärke-Anforderungen wie bei Registrierung
- [ ] Confirmation-Email nach erfolgreichem Passwort-Reset
- [ ] Token wird nach Gebrauch ungültig gemacht
- [ ] Rate Limiting: 3 Reset-Anfragen pro Email pro Stunde
- [ ] User muss neue Passwort-Anforderungen bestätigen
- [ ] Reset-Seite zeigt neue Passwort-Anforderungen an

## Edge Cases
- **Nicht existente Email**: Zeigt "Wenn Email existiert, Link gesendet" (Security durch Obscurity)
- **Abgelaufener Token**: "Reset-Link abgelaufen. Bitte neuen anfordern."
- **Bereits benutzter Token**: "Reset-Link bereits verwendet. Bitte neuen anfordern."
- **Rate Limit Exceeded**: "Zu viele Anfragen. Bitte warten 60 Minuten."
- **Schwaches neues Passwort**: Zeigt spezifische Passwort-Anforderungen
- **Email Service Down**: "Technische Probleme. Bitte später versuchen."
- **Multiple Active Tokens**: Nur neuester Token ist gültig (ältere invalidiert)
- **Social Login User**: "Password nicht verfügbar für OAuth-Accounts"

## Technische Anforderungen
- **Security**: Cryptographically secure Random Tokens (128-bit)
- **Performance**: < 500ms für Reset-Email-Versand
- **Email**: Supabase Email Service mit HTML Templates
- **Database**: Separate password_resets Tabelle mit TTL
- **Rate Limiting**: Supabase Row Level Security oder Middleware
- **Audit Trail**: Alle Reset-Versuche geloggt für Security

## Dependencies
- Benötigt: PROJ-1 (User Registration) - für User-Existenz
- Benötigt: PROJ-3 (Session Management) - für Session-Invalidierung nach Reset

## File Location
/src/app/(auth)/forgot-password/page.tsx
/src/app/(auth)/reset-password/page.tsx
/src/app/api/auth/forgot-password/route.ts
/src/app/api/auth/reset-password/route.ts

## Tech-Design (Solution Architect)

### Component-Struktur
Password Reset System
├── Forgot Password Page
│   ├── Page Layout mit Branding
│   ├── Instructions Section
│   │   ├── Process Erklärung
│   │   └── Expected Delivery Time
│   ├── Email Input Form
│   │   ├── Email Validation
│   │   ├── Loading State
│   │   └── Success/Error Messages
│   ├── Security Notice
│   │   ├── Rate Limiting Info
│   │   └── Email Verification Requirement
│   └── Back to Login Link
├── Reset Password Page
│   ├── Page Layout mit Security Branding
│   ├── Token Validation Section
│   │   ├── Token Expiration Check
│   │   ├── Token Usage Verification
│   │   └── Error Handling für invalid Tokens
│   ├── New Password Form
│   │   ├── Password Input mit Strength Indicator
│   │   ├── Password Confirmation Input
│   │   ├── Requirements Checklist
│   │   └── Submit Button mit Loading
│   ├── Security Information
│   │   ├── Session Invalidation Notice
│   │   └── Login after Reset Info
│   └── Resend Request Link
├── Email Templates
│   ├── Reset Request Email
│   │   ├── Personalized Greeting
│   │   ├── Reset Button mit Embedded Token
│   │   ├── Security Information
│   │   ├── Expiration Notice
│   │   └── Ignore Instructions
│   └── Reset Confirmation Email
│       ├── Success Notification
│       ├── Security Alert
│       ├── Device Information
│       └── Support Contact
├── API Security Layer
│   ├── Rate Limiting Protection
│   │   ├── Per-Email Rate Limiting
│   │   ├── Per-IP Rate Limiting
│   │   └── Global Abuse Protection
│   ├── Token Security
│   │   ├── Cryptographically Secure Generation
│   │   ├── One-way Hashing
│   │   ├── Single Usage Enforcement
│   │   └── Automatic Cleanup
│   └── Session Management
│       ├── All Sessions Invalidation
│       ├── Automatic Logout
│       └── Security Event Logging
└── Admin Dashboard Features
    ├── Reset Request Monitoring
    ├── Failed Reset Tracking
    ├── Security Analytics
    └── Manual Intervention Tools

### Daten-Model
Password Resets Tabelle:
- Reset ID (Primary Key, UUID)
- User ID (Foreign Key, unique constraint)
- Reset Token (one-way hash)
- Token Expiration (15 Minuten)
- Created At Timestamp
- Used At Timestamp (nullable)
- IP Address bei Request
- User Agent String
- Delivery Status (pending, sent, failed)
- Bounce Tracking Information

Reset Attempts Logging:
- Attempt ID (Primary Key)
- Email Address (hashed)
- IP Address
- Timestamp
- Success/Failure Status
- Error Code
- User Agent
- Geographic Information

Security Events:
- Event ID (Primary Key)
- User ID (nullable für anonymous requests)
- Event Type (password_reset_request, password_reset_complete)
- IP Address
- Device Fingerprint
- Timestamp
- Additional Metadata

### Tech-Entscheidungen
Warum Time-limited Reset Tokens?
→ Reduziert Angriffsfläche drastisch
→ Forces schnelle User Action
→ Automatic Cleanup verhindert Database Bloat
→ Industry Standard für Security
→ Compliance mit Security Best Practices

Warum Rate Limiting pro Email/IP?
→ Prevents Email Spamming
→ Schutz gegen Brute-Force auf Resets
→ Reduces Email Provider Costs
→ Improves System Reliability
── Fair Resource Allocation

Warum "Security durch Obscurity" bei nicht existenten Emails?
→ Verhindert Email Enumeration
── Schützt User Privacy
── Reduces Attack Surface
── Standard Practice in Auth Systems
── GDPR-konform

Warum Single Usage Tokens?
→ Prevents Replay Attacks
── Forces Fresh Request für jeden Reset
── Simplifies Security Model
── Reduces Token Abuse Potential
── Easier Audit Trail

### Dependencies
Benötigte Packages:
- @supabase/auth-js (Email Templates)
- nodemailer oder Supabase Email (Email Versand)
- crypto-random-string (Token Generation)
- bcryptjs (Token Hashing)
- date-fns (Time Calculations)
- react-hook-form (Form Management)
- @hookform/resolvers (Validation)
- zod (Type-safe Validation)

Security Dependencies:
- express-rate-limit (Rate Limiting)
- helmet (Security Headers)
- csurf (CSRF Protection)
- ip-location (Geographic Tracking)
- ua-parser-js (Device Analysis)

Email Dependencies:
- @supabase/emails (Template System)
- mjml (Responsive Email Templates)
- handlebars (Template Variables)
- aws-ses oder SendGrid (Delivery)

### Integration Patterns
Email Integration:
→ Supabase Email Service für Reliability
→ Template-based Email Generation
→ Bounce Handling und Retry Logic
→ Delivery Status Tracking
→ HTML + Text Versions für Compatibility

Token Security:
→ Cryptographically Secure Random Generation
→ One-way Hashing vor Database Storage
→ Automatic Expiration Enforcement
→ Immediate Invalidation nach Gebrauch
── Secure Transmission via HTTPS

Form Security:
→ CSRF Token Protection
→ Input Sanitization und Validation
── Rate Limiting mit Sliding Window
── Device Fingerprinting für Anomalie Detection
── Graceful Error Handling

Backend Integration:
── Atomic Database Operations
── Transaction-safe Token Creation
── Event Sourcing für Audit Trail
── Background Jobs für Cleanup
── Monitoring und Alerting

### Performance Considerations
Token Generation:
── Vorkompilierte Templates für Emails
── Batch Operations für Cleanup
── Database Indexes für schnelle Lookups
── Connection Pooling für High Load
── Edge Caching für Rate Limiting

Email Delivery:
── Queue-based Processing für Reliability
── Retry Logic mit Exponential Backoff
── Bounce Detection und Handling
── Provider Fallback Mechanism
── Delivery Analytics

Database Optimizations:
── Composite Indexes für User+Token Queries
── TTL-based Automatic Cleanup
── Partitioning für Large Scale
── Read Replicas für Performance
── Efficient Query Patterns

Security Performance:
── Cached Rate Limiting mit Redis
── Precomputed Token Hashes
── Optimized Database Schemas
── Minimal Logging Overhead
── Efficient Security Checks

### Security Architecture
Token Security:
── 128-bit Cryptographically Secure Tokens
── One-way Hashing mit bcrypt
── Automatic Single Usage Enforcement
── Secure Random Number Generation
── Tamper-evident Design

Attack Prevention:
── Rate Limiting auf mehreren Ebenen
── IP-based Blacklisting für Abuse
── CAPTCHA bei verdächtigen Mustern
── Geographic Anomaly Detection
── Device Fingerprinting

Data Protection:
── Email Address Hashing für Logs
── Minimal Data Retention
── GDPR-konforme Data Handling
── Secure Token Storage
── Privacy-focused Design

Incident Response:
── Automated Security Event Logging
── Real-time Alerting für Anomalies
── Manual Override Capabilities
── Emergency Disable Procedures
── Forensic Data Preservation