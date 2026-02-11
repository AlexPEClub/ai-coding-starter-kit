# PROJ-1: Admin-Authentifizierung

## Status: 🔵 Planned

## Beschreibung
Login-System für mehrere Administratoren, die Stützpunkte und Widget-Einstellungen im Backend verwalten.

## User Stories
- Als Admin möchte ich mich mit Email und Passwort einloggen, um auf das Backend zugreifen zu können
- Als Admin möchte ich mich ausloggen können, um meinen Zugang zu schützen
- Als Admin möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe
- Als eingeloggter Admin möchte ich weitere Admin-Accounts anlegen können, um Kollegen Zugang zu geben
- Als Admin möchte ich andere Admin-Accounts deaktivieren können, um den Zugang zu entziehen

## Acceptance Criteria
- [ ] Login-Formular mit Email + Passwort
- [ ] Session bleibt nach Browser-Reload erhalten (JWT oder Supabase Auth Session)
- [ ] Logout-Button im Backend-Header
- [ ] Passwort-Reset per Email möglich
- [ ] Admin-Liste: Alle Admins sehen, neue anlegen, bestehende deaktivieren
- [ ] Mindestens ein Admin muss immer existieren (letzter Admin kann nicht gelöscht werden)
- [ ] Alle Backend-Routen sind nur authentifiziert erreichbar
- [ ] Nach 3 fehlgeschlagenen Login-Versuchen: Rate Limiting (5 Min Sperre)

## Edge Cases
- Was passiert bei doppelter Email? → Fehlermeldung "Email bereits vergeben"
- Was passiert wenn Session abläuft? → Redirect zum Login mit Hinweis
- Was passiert wenn der letzte Admin sich selbst löschen will? → Wird verhindert mit Fehlermeldung
- Was passiert bei Brute-Force? → Rate Limiting nach 3 Versuchen

## Technische Anforderungen
- Supabase Auth für User-Management
- Row Level Security (RLS) auf allen Backend-Tabellen
- HTTPS only
- Passwort-Mindestlänge: 8 Zeichen

## Tech-Design (Solution Architect)

### Component-Struktur

```
/admin/login          ← Login-Seite (öffentlich)
/admin/               ← Dashboard (geschützt)
/admin/admins         ← Admin-Verwaltung (geschützt)

Gemeinsame Komponenten:
├── AdminLayout       ← Wrapper mit Header, Sidebar, Auth-Check
│   ├── AdminHeader   ← Logo, User-Name, Logout-Button
│   └── AdminSidebar  ← Navigation (Stützpunkte, Services, Einstellungen, Admins)
├── LoginForm         ← Email + Passwort Formular
├── AdminList         ← Tabelle aller Admins
└── CreateAdminDialog ← Modal zum Anlegen neuer Admins
```

### Daten-Model

```
Admins werden über Supabase Auth verwaltet (kein eigener Table nötig):
- Email-Adresse
- Verschlüsseltes Passwort (von Supabase verwaltet)
- Status (aktiv/deaktiviert)
- Letzter Login (automatisch)

Session-Daten:
- Gespeichert in: Supabase Auth Session (Cookie-basiert)
- Gültigkeitsdauer: 7 Tage (automatisch verlängert)
```

### Tech-Entscheidungen

```
Warum Supabase Auth statt eigenem Login-System?
→ Bereits im Projekt. Bietet Login, Session, Passwort-Reset, Rate Limiting fertig.

Warum Next.js Middleware für Route Protection?
→ Prüft bei JEDEM Request ob User eingeloggt ist. Leitet zum Login weiter falls nicht.

Warum AdminLayout als gemeinsamen Wrapper?
→ Header + Sidebar nur einmal bauen, alle Admin-Seiten nutzen das gleiche Layout.
```

### Dependencies
- Keine zusätzlichen Packages nötig (Supabase Auth ist bereits installiert)
