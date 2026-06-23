# ZUSAMMEN – Design System / Style Guide

Referenz für Claude Code. Stack: Next.js 16 + TypeScript, Tailwind CSS, shadcn/ui.
Mobile-First, responsive Desktop-Erweiterung. Light + Dark Mode.

Quelle der Tokens: aus Plakat-Vorlage abgeleitet (Farben, Grotesk-Typografie, Formen, Abstände), App-Systeme (Radien, Schatten, Zustände, semantische Farben) ergänzt.

---

## 1. Design-Prinzipien

- Eine geometrische Grotesk in mehreren Gewichten; Überschriften schwer (800–900), `uppercase` bei Eyebrows/Overlines.
- Warme Cream-Fläche statt reinem Weiß; warmes Schwarz statt `#000`.
- Terracotta = primäre Aktion. Navy = sekundär. Gold = Akzent/Hinweis.
- Buttons und Inputs `radius-md` (12px), Karten `radius-lg` (18px), Chips/Avatare `pill`.
- 1,5px Ränder an interaktiven Elementen, Hairline-Borders (1px) an Trennern.
- 8pt-Spacing-Raster.
- Dark Mode: warmes Schwarz, aufgehellte Akzente (kein reines Schwarz, kein Neon).

---

## 2. Farben (Tokens)

### Light

| Token | Hex | Verwendung |
|---|---|---|
| `--bg` | `#F8EBD9` | App-Hintergrund |
| `--surface` | `#FFFFFF` | Karten, Inputs |
| `--surface-2` | `#FCF4E8` | Subtile Flächen, Segmented, Stepper |
| `--ink` | `#1B1714` | Primärtext |
| `--ink-2` | `#4F4840` | Sekundärtext |
| `--ink-3` | `#8B8175` | Tertiär/Placeholder |
| `--line` | `#E7DAC6` | Borders, Divider |
| `--primary` | `#C8432D` | CTAs, aktive Zustände |
| `--primary-600` | `#B0341F` | Hover/Pressed |
| `--primary-soft` | `#F8E3DB` | Tints, Badge-BG |
| `--secondary` | `#1A3B78` | Sekundäraktion, Datums-Chips |
| `--secondary-600` | `#142E5E` | Hover |
| `--secondary-soft` | `#DFE5F1` | Tints |
| `--accent` | `#DC973A` | Akzent, Hinweis |
| `--accent-soft` | `#F8E9CF` | Tints |

### Dark

| Token | Hex | Verwendung |
|---|---|---|
| `--bg` | `#15110C` | App-Hintergrund (warmes Schwarz) |
| `--surface` | `#211A12` | Karten, Inputs |
| `--surface-2` | `#2C2318` | Erhöhte Flächen |
| `--ink` | `#F2E9DA` | Primärtext |
| `--ink-2` | `#B7AC9A` | Sekundärtext |
| `--ink-3` | `#857B6B` | Tertiär/Placeholder |
| `--line` | `#352B1F` | Borders, Divider |
| `--primary` | `#E15B43` | CTAs (aufgehellt) |
| `--primary-soft` | `rgba(225,91,67,.18)` | Tints |
| `--secondary` | `#6E90D4` | Sekundär (aufgehellt) |
| `--secondary-soft` | `rgba(110,144,212,.18)` | Tints |
| `--accent` | `#E9AC52` | Akzent |
| `--accent-soft` | `rgba(233,172,82,.18)` | Tints |

### Semantisch (Light / Dark)

| Token | Light | Dark | Verwendung |
|---|---|---|---|
| `--success` | `#2E8B57` | `#4FB07A` | Erfolg, „erledigt", Toggle-on |
| `--success-soft` | `#DCEEE2` | `rgba(79,176,122,.18)` | Tint |
| `--warning` | `#DC973A` | `#E9AC52` | Warnung (= accent) |
| `--error` | `#C1311E` | `#E15B43` | Fehler, destruktiv |
| `--error-soft` | `#F7DED7` | `rgba(225,91,67,.18)` | Tint |
| `--info` | `#1A3B78` | `#6E90D4` | Info (= secondary) |

> `error` ist bewusst dunkler/satter als `primary`, damit Fehlerzustände nicht mit der Marken-CTA verwechselt werden.

### Neutrale Skala (warm)

`50 #F4F0E9` · `100 #E9E2D6` · `200 #D8CEBE` · `300 #BDB2A0` · `400 #9C9082` · `500 #786E62` · `600 #574F45` · `700 #3A342D` · `800 #211D18` · `900 #1B1714`

### Rollen-Farben (visuell unterscheidbar)

| Rolle | Farbe | Token |
|---|---|---|
| Admin | Terracotta | `primary` / `primary-soft` |
| Redakteur (editor) | Navy | `secondary` / `secondary-soft` |
| Beobachter (observer) | Gold | `accent` / `accent-soft` |

### Aktivitäts-Cover (Gradients, beide Modi gleich)

```css
--cover-a: linear-gradient(135deg, #C8432D, #8F2A1B); /* terracotta */
--cover-b: linear-gradient(135deg, #1A3B78, #10264C); /* navy */
--cover-c: linear-gradient(135deg, #DC973A, #A9651A); /* gold */
--cover-k: linear-gradient(135deg, #574F45, #2C2318); /* neutral */
```

---

## 3. Typografie

Familie: **Archivo** (offen verfügbar, Google Fonts). Gewichte 400/500/600/700/800/900.

```ts
// next/font
import { Archivo } from "next/font/google";
export const archivo = Archivo({ subsets: ["latin"], weight: ["400","500","600","700","800","900"], variable: "--font-archivo" });
```

| Style | Größe | Weight | Line-height | Tracking | Einsatz |
|---|---|---|---|---|---|
| Display / H1 | 40 | 900 | 1.05 | -0.025em | Hero, App-Titel |
| H2 | 30 | 800 | 1.12 | -0.01em | Sektionen |
| H3 | 23 | 700 | 1.2 | 0 | Untertitel |
| H4 / Title | 18 | 700 | 1.3 | 0 | Karten, Listen |
| Overline | 12 | 700 | 1 | 0.10em / `uppercase` | Eyebrows, Labels |
| Body L | 17 | 400 | 1.55 | 0 | Detailtexte |
| Body | 15 | 400 | 1.6 | 0 | Standard |
| Caption | 13 | 500 | 1.45 | 0 | Meta, Zeitstempel |
| Button/Label | 15 | 600 | 1 | 0.005em | Interaktiv |

---

## 4. Spacing, Radien, Schatten

### Spacing (8pt)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

### Radien

| Token | Wert | Einsatz |
|---|---|---|
| `--radius-sm` | 8px | Inputs (klein), Badges |
| `--radius-md` | 12px | **Buttons, Inputs (Default)** |
| `--radius-lg` | 18px | Karten, Sheets, Modals |
| `--radius-pill` | 999px | Chips, Avatare, Pill-Buttons |

### Schatten

```css
--shadow-sm: 0 1px 2px rgba(27,23,20,.06);   /* Listen, Inputs */
--shadow-md: 0 4px 14px rgba(27,23,20,.09);  /* Karten, Button-Hover */
--shadow-lg: 0 14px 38px rgba(27,23,20,.12); /* Modals, Sheets */
```

> Im Dark Mode Schatten reduzieren oder weglassen; Tiefe stattdessen über `surface`/`surface-2` und `line` definieren.

---

## 5. CSS-Variablen (globals.css)

```css
:root {
  --bg:#F8EBD9; --surface:#FFFFFF; --surface-2:#FCF4E8;
  --ink:#1B1714; --ink-2:#4F4840; --ink-3:#8B8175; --line:#E7DAC6;
  --primary:#C8432D; --primary-600:#B0341F; --primary-soft:#F8E3DB;
  --secondary:#1A3B78; --secondary-600:#142E5E; --secondary-soft:#DFE5F1;
  --accent:#DC973A; --accent-soft:#F8E9CF;
  --success:#2E8B57; --success-soft:#DCEEE2;
  --warning:#DC973A; --error:#C1311E; --error-soft:#F7DED7; --info:#1A3B78;
  --radius-sm:8px; --radius-md:12px; --radius-lg:18px; --radius-pill:999px;
  --shadow-sm:0 1px 2px rgba(27,23,20,.06);
  --shadow-md:0 4px 14px rgba(27,23,20,.09);
  --shadow-lg:0 14px 38px rgba(27,23,20,.12);
}

.dark {
  --bg:#15110C; --surface:#211A12; --surface-2:#2C2318;
  --ink:#F2E9DA; --ink-2:#B7AC9A; --ink-3:#857B6B; --line:#352B1F;
  --primary:#E15B43; --primary-600:#E15B43; --primary-soft:rgba(225,91,67,.18);
  --secondary:#6E90D4; --secondary-600:#6E90D4; --secondary-soft:rgba(110,144,212,.18);
  --accent:#E9AC52; --accent-soft:rgba(233,172,82,.18);
  --success:#4FB07A; --success-soft:rgba(79,176,122,.18);
  --warning:#E9AC52; --error:#E15B43; --error-soft:rgba(225,91,67,.18); --info:#6E90D4;
}
```

---

## 6. Tailwind-Anbindung

### Tailwind v4 (`@theme inline` in globals.css)

```css
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-line: var(--line);
  --color-primary: var(--primary);
  --color-primary-soft: var(--primary-soft);
  --color-secondary: var(--secondary);
  --color-secondary-soft: var(--secondary-soft);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-success: var(--success);
  --color-error: var(--error);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --font-sans: var(--font-archivo);
}
```

Nutzung: `bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-primary`, `text-primary`, `rounded-md`, etc.

### shadcn/ui Mapping

shadcn nutzt semantische Namen. Mapping in `:root` / `.dark` ergänzen:

```css
--background: var(--bg);
--foreground: var(--ink);
--card: var(--surface);
--card-foreground: var(--ink);
--popover: var(--surface);
--popover-foreground: var(--ink);
--primary: var(--primary);
--primary-foreground: #FFFFFF;
--secondary: var(--secondary);
--secondary-foreground: #FFFFFF;
--muted: var(--surface-2);
--muted-foreground: var(--ink-3);
--accent: var(--accent);
--accent-foreground: #1B1714;
--destructive: var(--error);
--destructive-foreground: #FFFFFF;
--border: var(--line);
--input: var(--line);
--ring: var(--accent);   /* Fokus-Ring in Gold */
--radius: 0.75rem;       /* 12px Basis */
```

---

## 7. Komponenten-Spezifikation

### Button

- Radius `md` (12px), Padding `12px 24px`, Border `1.5px`, Font 15/600, Gap 8px.
- Fokus: `outline: 3px solid var(--accent); outline-offset:2px` (Gold-Ring).
- Größen: `sm` `8px 16px / 13px`, `md` (Default), `lg` `16px 32px / 17px`.
- Disabled: `opacity:.4`.

| Variante | Background | Text | Border |
|---|---|---|---|
| `primary` | `primary` | `#fff` | `primary-600` |
| `secondary` | `secondary` | `#fff` | `secondary-600` |
| `ghost` | transparent | `ink` | `ink` |
| `destructive` | transparent | `error` | `error` (Hover: gefüllt) |
| `pill` | wie oben | — | `radius-pill` |

### Input / Field

- Background `surface`, Border `1.5px line`, Radius `md`, Padding `12px 14px`, Font 15.
- Label 13/600 `ink-2`, Helper 11.5 `ink-3`.
- Focus: Border `secondary` + `box-shadow:0 0 0 3px var(--secondary-soft)`.
- Error: Border `error` + `box-shadow:0 0 0 3px var(--error-soft)`, Helper `error`.

### Checkbox

- 21px, Radius 6px, Border `2px line`. Checked: `bg/border primary`, weißes Häkchen.

### Segmented Control (Dauer-Kategorie)

- Container `surface-2`, Border `1.5px line`, Radius `md`, Padding 3px.
- Segmente Radius 9px, Font 12/700; aktiv `bg-primary text-white`.

### Stepper (Upvote-Schwelle)

- Container `surface`, Border `1.5px line`, Radius `md`.
- Buttons 34px, Radius 9px, `surface-2`; Wert 18/800.

### Card

- Background `surface`, Border `1px line`, Radius `lg` (18px), Padding 16–20px, `shadow-md`.

### Chip / Filter

- Radius `pill`, Padding `7–8px 13–14px`, Font 12.5–13/700, Border `1.5px line`.
- Aktiv: `bg-primary text-white border-primary`.

### Badge / Role

- Radius `pill`, Padding `3px 8px`, Font 10.5/800 `uppercase`.
- `admin`→primary-soft/primary, `editor`→secondary-soft/secondary, `observer`→accent-soft/accent.

### Avatar

- `pill`, default `secondary`, Initialen 12/800 weiß. Varianten: r=primary, g=accent, k=neutral-600.
- Stack: `margin-left:-9px`, `border:2px solid var(--bg)`.

### Switch (Toggle)

- 42×25px, `pill`. Off `line`, On `success`. Knopf 20px weiß.

### Vote-Card

- Thumb 56–58px Cover, Radius 12. Fortschrittsbalken (`vbar`) + „X/Y" zur Upvote-Schwelle.
- Vote-Button: `votebtn`, aktiv `primary-soft`/`primary`.

### Kanban-Card

- Cover-Strip oben (64–70px), Body Padding 10–11px.
- Titel 13.5–14/700, Meta mit Initiator-Avatar, Datums-Chip (`daterange`: secondary-soft/secondary).
- Optionale Progressbar `kprog` mit „X/Y".

### Status / Daterange-Pill

- Daterange: `secondary-soft` / `secondary`, Icon + Text 11/700.
- Status-Pill auf Cover: `rgba(27,23,20,.5)` BG, weißer Text, Punkt nach Status-Farbe.

### Kalender-Export-Button (Detail)

- State „nicht hinzugefügt": `btn primary` „Zu meinem Kalender hinzufügen".
- State „hinzugefügt": `success-soft`/`success`, Häkchen, „Im Kalender".
- State „kein Kalender verbunden": Weiterleitung zur Kalender-Verbindung.

### Bottom-Tab-Bar (Mobile)

- 62px, `surface`, Top-Border `line`. 5 Items: Übersicht, Board, [+] (zentral erhöht), Termine, Profil.
- Aktiv `primary`. Zentraler FAB 50px `primary`, `border:3px solid var(--surface)`.

### Sidebar (Desktop)

- 240–248px, `surface`/seitliche Fläche, Border-right `line`.
- Projekt-Switcher oben, Nav-Links (aktiv `primary-soft`/`primary`), User-Card unten.
- Topbar 62px mit Titel, globaler Suche, Aktionen, Avatar.

---

## 8. Plattform-Hinweise

- **iOS:** Dynamic-Island-Statusbar, Home-Indicator. **Android:** Hole-Punch, Gesten-Pill; Touch-Ziele ≥ 48dp.
- **Web/Desktop:** Sidebar-Navigation statt Tab-Bar; Board zeigt alle 4 Spalten gleichzeitig.
- Dark Mode über `.dark`-Klasse am `<html>` (z. B. `next-themes`), `prefers-color-scheme` als Default.
- Cover-Gradients in beiden Modi identisch (genug Kontrast für weißen Text).

---

## 9. Board-Status-Mapping (Datenmodell)

| DB-Status | Label | Spalten-Dot |
|---|---|---|
| `zu_planen` | Zu Planen | `primary` |
| `in_planung` | In Planung | `accent` |
| `planung_abgeschlossen` | Planung abgeschlossen | `secondary` |
| `abgeschlossen` | Abgeschlossen | `success` |

Übergang `zu_planen` → `in_planung`: sobald `votes ≥ benötigte_upvotes` (Fortschritt „X/Y" auf Karte).

---

## 10. Do / Don't

- **Do:** Terracotta nur für primäre Aktionen/aktive Zustände. Überschriften schwer und knapp. Warme Neutraltöne.
- **Don't:** Reines `#000`/`#FFF`, Neon im Dark Mode, mehr als eine Schriftfamilie, Schatten als Border-Ersatz im Dark Mode, `error` und `primary` im selben Kontext verwechselbar einsetzen.
