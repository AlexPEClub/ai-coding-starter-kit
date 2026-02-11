# PROJ-5: Basic User Profile

## Status: 🔵 Planned

## User Stories
- Als eingeloggter User möchte ich mein Profil anzeigen und bearbeiten um meine Daten aktuell zu halten
- Als User möchte ich meinen Namen und Avatar ändern um Personalisierung zu ermöglichen
- Als Security-Admin möchte ich Email-Änderung mit Verifikation schützen um Account-Übernahme zu verhindern
- Als User möchte ich mein Konto löschen können um meine Daten zu kontrollieren (GDPR)

## Acceptance Criteria
- [ ] User kann Profil-Daten anzeigen (Name, Email, Avatar, Registrierungsdatum)
- [ ] User kann Namen und Avatar aktualisieren
- [ ] Email-Änderung erfordert neue Verifikation
- [ ] Avatar Upload mit Bild-Validierung (JPG, PNG, max 2MB)
- [ ] Profile-Änderungen werden sofort gespeichert
- [ ] Konto-Löschung mit Bestätigung und 30-tägiger Grace-Periode
- [ ] Email-Benachrichtigung bei wichtigen Profil-Änderungen
- [ ] Account-Status anzeigen (verifiziert, aktiv)
- [ ] Login-Geschichte anzeigen (letzten 10 Logins mit Gerät/IP)
- [ ] Passwort-Änderung möglich über Profil-Seite

## Edge Cases
- **Avatar Upload Fehler**: "Falsches Format oder Datei zu groß (max 2MB)"
- **Email-Änderung Konflikt**: "Email bereits verwendet"
- **Konto-Löschung**: "Alle Daten werden nach 30 Tagen endgültig gelöscht"
- **Network Issues**: Optimistic UI Updates mit serverseitiger Validierung
- **Concurrent Updates**: Last-writer-wins mit timestamp
- **Storage Limit**: Max 5MB pro User für Avatar/Grafiken
- **Profile Viewing**: Andere User können kein Profil sehen (keine public profiles)
- **GDPR Export**: User kann alle Daten exportieren vor Löschung

## Technische Anforderungen
- **Storage**: Supabase Storage für Avatars
- **File Upload**: Client-seitige Validierung + server-seitige checks
- **Security**: Row Level Security für Profil-Zugriff
- **Performance**: < 200ms für Profil-Laden
- **GDPR**: Data Portability und Right to Erasure
- **Audit**: Alle Profil-Änderungen werden mit timestamp geloggt

## Dependencies
- Benötigt: PROJ-2 (User Login) - für authentifizierten Zugriff
- Benötigt: PROJ-3 (Session Management) - für Session-Validierung

## File Location
/src/app/dashboard/profile/page.tsx
/src/app/api/user/profile/route.ts
/src/app/api/user/avatar/route.ts
/src/components/profile/ProfileForm.tsx

## Tech-Design (Solution Architect)

### Component-Struktur
User Profile System
├── Profile Dashboard Page
│   ├── Page Layout mit User Navigation
│   ├── Profile Overview Section
│   │   ├── Avatar Display mit Upload Button
│   │   ├── User Name Display
│   │   ├── Email Address Display
│   │   ├── Account Status Badge
│   │   └── Registration Date Display
│   ├── Profile Edit Form
│   │   ├── Name Input Field mit Validation
│   │   ├── Email Change Section
│   │   │   ├── New Email Input
│   │   │   ├── Password Confirmation
│   │   │   └── Verification Notice
│   │   ├── Avatar Upload Component
│   │   │   ├── File Input mit Drag & Drop
│   │   │   ├── Image Preview
│   │   │   ├── Crop Tool
│   │   │   └── Validation Feedback
│   │   └── Save/Cancel Actions
│   ├── Security Section
│   │   ├── Password Change Button
│   │   ├── Two-Factor Setup (future)
│   │   ├── Active Sessions List
│   │   └── Logout All Devices Button
│   ├── Account Management
│   │   ├── Login History Display
│   │   ├── Data Export Button
│   │   ├── Account Deletion Section
│   │   └── Privacy Settings
│   └── Notification Preferences
│       ├── Email Notifications Toggle
│       ├── Security Alerts Toggle
│       └── Marketing Communications Toggle
├── Avatar Upload System
│   ├── File Upload Component
│   │   ├── Drag & Drop Zone
│   │   ├── File Selection Button
│   │   ├── Progress Indicator
│   │   └── Error Display
│   ├── Image Processing Pipeline
│   │   ├── Client-side Validation
│   │   ├── Image Compression
│   │   ├── Aspect Ratio Adjustment
│   │   └── Format Conversion
│   ├── Storage Integration
│   │   ├── Supabase Storage Upload
│   │   ├── Unique Filename Generation
│   │   ├── Metadata Storage
│   │   └── Cleanup Operations
│   └── Preview Management
│       ├── Real-time Preview
│       ├── Undo Functionality
│       ├── Version History
│       └── Fallback to Default
├── Email Verification Flow
│   ├── Email Change Request
│   │   ├── New Email Input Form
│   │   ├── Password Confirmation
│   │   ├── Verification Email Sending
│   │   └── Pending Status Display
│   ├── Verification Process
│   │   ├── Email Link Handling
│   │   ├── Token Validation
│   │   ├── Atomic Email Update
│   │   └── Notification System
│   └── Rollback Mechanism
│       ├── Verification Timeout
│       ├── Failed Verification
│       └── Original Email Restoration
├── Account Deletion System
│   ├── Deletion Request Flow
│   │   ├── Confirmation Dialog
│   │   ├── Password Verification
│   │   ├── Reason Collection
│   │   └── Grace Period Setup
│   ├── Grace Period Management
│   │   ├── 30-day Countdown
│   │   ├── Cancellation Option
│   │   ├── Immediate Data Wipe Option
│   │   └── Data Export Preparation
│   └── Data Deletion Pipeline
│       ├── Automatic Deletion after Grace Period
│       ├── Complete Data Wipe
│       ├── Audit Trail Preservation
│       └── Confirmation Notification
└── Data Export System
    ├── Export Request Handler
    │   ├── Data Collection
    │   ├── Format Selection
    │   ├── Compression
    │   └── Secure Download Link
    ├── Export Content
    │   ├── Profile Information
    │   ├── Login History
    │   ├── Account Settings
    │   └── Associated Data
    └── Download Management
        ├── Temporary Secure Links
        ├── Access Tracking
        ├── Automatic Cleanup
        └── Download History

### Daten-Model
User Profiles Tabelle (extends auth.users):
- User ID (Primary Key, Foreign Key)
- Display Name (string, nullable)
- Avatar URL (string, nullable)
- Email Change Pending (boolean)
- New Email (string, nullable)
- Email Verification Token (string, nullable)
- Account Deletion Requested (boolean)
- Deletion Request Date (timestamp)
- Grace Period End Date (timestamp)
- Data Export Requested (boolean)
- Export Ready (boolean)
- Export Download URL (string, nullable)
- Profile Updated At (timestamp)
- Privacy Settings (JSON)

Avatar Storage Metadata:
- File ID (Primary Key)
- User ID (Foreign Key)
- Original Filename
- Storage Path
- File Size
- MIME Type
- Upload Date
- Last Accessed
- Compression Settings

Email Change History:
- Change ID (Primary Key)
- User ID (Foreign Key)
- Old Email
- New Email
- Change Date
- Verified Flag
- Verification Date
- IP Address
- User Agent

Account Activity Log:
- Activity ID (Primary Key)
- User ID (Foreign Key)
- Activity Type (profile_update, email_change, password_change)
- Old Values (JSON)
- New Values (JSON)
- Timestamp
- IP Address
- Device Information

### Tech-Entscheidungen
Warum Supabase Storage für Avatars?
→ Integrated mit Auth System
→ Built-in File Upload Security
→ Automatic CDN Distribution
→ Row Level Security Protection
→ Cost-effective für Images

Warum Client-side Image Processing?
→ Reduziert Server Load
→ Schnelle User Feedback
── File Size Optimization vor Upload
── Progressive Enhancement
── Better Mobile Experience

Warum Email Change mit Verification?
→ Verhindert Account Hijacking
── Zweistufige Bestätigung
── Security für sensible Änderungen
── Audit Trail für Compliance
── GDPR-konforme Datenänderung

Warum Grace Period für Account Deletion?
── Users können ihre Entscheidung überdenken
── Datenrettung bei Fehlern
── Legal Requirements für Data Retention
── Better User Experience
── Reduced Support Tickets

### Dependencies
Benötigte Packages:
- @supabase/storage-js (File Uploads)
- react-dropzone (Drag & Drop Uploads)
- react-image-crop (Image Cropping)
- browser-image-compression (File Optimization)
- file-saver (Data Export Download)
- react-hook-form (Form Management)
- @hookform/resolvers mit zod (Validation)
- date-fns (Date Operations)

Avatar Processing:
- sharp (Server-side Image Processing)
- @types/sharp (TypeScript Support)
- multer (File Upload Middleware)
- mime-types (File Type Detection)
- crypto (Secure Filenames)

Security Dependencies:
- helmet (Security Headers)
- rate-limiter-flexible (Rate Limiting)
- csurf (CSRF Protection)
- bcryptjs (Password Confirmation)
- crypto-random-string (Token Generation)

Export Dependencies:
- json2csv (CSV Export)
- archiver (ZIP Creation)
- stream (File Streaming)
- fs-extra (File Operations)
- @types/archiver (TypeScript)

### Integration Patterns
Avatar Integration:
→ Drag & Drop mit react-dropzone
→ Client-side Compression vor Upload
→ Supabase Storage mit Row Level Security
→ Automatic CDN Distribution
→ Fallback zu Default Avatar

Form Integration:
→ React Hook Form mit Zod Validation
→ Optimistic Updates für besseres UX
→ Server-seitige Verification für Security
→ Undo-Funktionalität für wichtige Änderungen
→ Cross-Tab State Synchronization

Security Integration:
→ Password Confirmation für sensible Änderungen
→ Email Verification für Identity Proof
→ Rate Limiting pro User/IP
→ Audit Logging für alle Änderungen
→ CSRF Protection für alle Forms

Data Export Integration:
→ Async Export Generation mit Queue
── Secure Download Links mit Expiration
── Multiple Formate (JSON, CSV)
── Incremental Exports für large Data
── Email Benachrichtigung bei Export Ready

### Performance Considerations
Image Optimization:
── Client-side Compression reduces Upload Time
── Multiple Sizes für verschiedene Use Cases
── Progressive Loading für Avatars
── Cache Headers für Browser Caching
── CDN Integration für globale Distribution

Database Performance:
── Database Indexes für Profile Queries
── Connection Pooling für High Concurrency
── Read Replicas für Profile Reads
── Efficient JSON Storage für Settings
── Batch Operations für Bulk Updates

File Storage Performance:
── Supabase Storage CDN Integration
── Automatic Image Optimization
── Cache Headers für Avatars
── Compression für File Uploads
── Lazy Loading für Profile Images

User Interface Performance:
── Progressive Enhancement für Forms
── Optimistic Updates für sofortiges Feedback
── Debounced Validations
── Virtual Scrolling für Activity History
── Skeleton Loading States

### Security Architecture
Data Protection:
── Row Level Security für Profile Access
── Encryption für sensitive Profile Data
── Secure File Upload mit Type Validation
── GDPR-konforme Data Handling
── Minimal Data Collection Principle

Account Security:
── Two-step Verification für Email Changes
── Password Confirmation für sensitive Actions
── Rate Limiting für Profile Updates
── Device Fingerprinting für Anomaly Detection
── Automatic Security Event Logging

Privacy Features:
── Granular Privacy Controls
── Data Portability mit Export
── Right to Erasure mit Grace Period
── Transparent Data Usage
── User-controlled Data Sharing

Access Control:
── Session-based Profile Access
── CSRF Protection für alle Forms
── Secure File Downloads mit Expiration
── Rate Limited API Access
── IP-based Anomaly Detection