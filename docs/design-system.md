# Design System — TierPhysio

## Overview
TierPhysio uses a modern, accessible design system based on the original Vite implementation. The design supports both light and dark modes with a focus on clarity, accessibility, and professional presentation for a healthcare/veterinary audience.

## Color Palette

### Primary Color: Sage Green
- **Base:** `hsl(154, 26%, 35%)` → `#1E3F20`
- **Light:** `hsl(154, 26%, 92%)` → Light sage background
- **Hover:** `hsl(154, 26%, 28%)` → Darker sage for interactions
- **Glow:** `hsla(154, 26%, 35%, 0.15)` → Soft shadow/focus effect

**Usage:** Primary buttons, active states, primary text, section titles

### Accent Colors

#### Orange (Alerts, Progress, Warnings)
- **Base:** `hsl(24, 90%, 58%)` → `#F4641E`
- **Light:** `hsl(24, 90%, 92%)` → Background tint
- **Usage:** Progress indicators, urgent feedback, highlights, pain levels

#### Blue (Information, Secondary Actions)
- **Base:** `hsl(198, 80%, 48%)` → `#1A9AD3`
- **Light:** `hsl(198, 80%, 92%)` → Background tint
- **Usage:** Secondary information, scheduled items, calendar dots, animal badges

### Neutral Colors

#### Light Mode
- **Background:** `hsl(40, 25%, 98%)` → Warm cream tone
- **Card Background:** `hsla(0, 0%, 100%, 0.85)` → Semi-transparent white
- **Text Primary:** `hsl(220, 15%, 15%)` → Dark charcoal
- **Text Secondary:** `hsl(220, 10%, 45%)` → Medium gray
- **Text Muted:** `hsl(220, 10%, 65%)` → Light gray
- **Border:** `hsl(220, 10%, 90%)` → Very light gray

#### Dark Mode
- **Background:** `hsl(220, 20%, 9%)` → Modern charcoal
- **Card Background:** `hsla(220, 20%, 14%, 0.75)` → Semi-transparent dark
- **Text Primary:** `hsl(220, 10%, 95%)` → Almost white
- **Text Secondary:** `hsl(220, 8%, 70%)` → Light gray
- **Text Muted:** `hsl(220, 8%, 45%)` → Medium gray
- **Border:** `hsl(220, 15%, 18%)` → Dark gray

## Typography

### Fonts
- **Headlines (H1-H6):** `Outfit` (weights: 600, 700, 800)
- **Body & UI:** `Inter` (weights: 300, 400, 500, 600, 700)
- **Fallback:** system-ui, -apple-system, sans-serif

### Font Sizes (Tailwind-compatible scaling)
- **H1:** `1.875rem` (30px) – Page titles
- **H3:** `1.25rem` (20px) – Section titles
- **H4:** `1rem` (16px) – Subsection titles
- **Body:** `0.95rem` (15px) – Default body text
- **Small:** `0.85rem` (13.6px) – Secondary text
- **Tiny:** `0.75rem` (12px) – Labels, badges

## Spacing & Sizing

### Border Radius
- **Small:** `8px` (forms, buttons, small cards)
- **Medium:** `16px` (panels, cards)
- **Large:** `24px` (large modals)

### Shadows
- **Small:** `0 2px 8px rgba(0, 0, 0, 0.04)` (light mode), `rgba(0, 0, 0, 0.2)` (dark)
- **Medium:** `0 8px 24px rgba(0, 0, 0, 0.06)` (light), `rgba(0, 0, 0, 0.3)` (dark)
- **Large:** `0 16px 40px rgba(0, 0, 0, 0.1)` (light), `rgba(0, 0, 0, 0.4)` (dark)

## Components Style Guide

### Buttons
- **Primary Button:** Sage Green bg, white text, shadow on hover
- **Secondary Button:** Transparent bg, border, dark text
- **Accent Button:** Orange bg, white text
- **Danger Button:** Red bg, white text
- **All buttons:** Outline on focus (primary glow)

### Cards / Glass Panels
- **Style:** Semi-transparent background with backdrop blur (12px)
- **Border:** 1px solid border-color
- **Shadow:** Medium shadow
- **Hover:** Shadow increases to large, border brightens

### Forms
- **Input/Textarea/Select:** Light background with border, padding 10px 14px
- **Focus State:** Border highlights to primary color, adds primary glow shadow
- **Labels:** Small gray text above input, weight 600

### Badges
- **Category Badge:** Light sage background, sage text (for exercise categories)
- **Status Badge:** 
  - Pending (orange): Orange-light bg, orange text
  - Reviewed (sage): Sage-light bg, sage text
  - Animal (blue): Blue-light bg, blue text

### Glassmorphism
- Background: Semi-transparent card background
- Backdrop Filter: `blur(12px)`
- Border: 1px solid, subtle color
- Shadow: Medium shadow for depth
- Used for: Main panels, overlays, floating elements

## Dark Mode Implementation

### How It Works
- Light mode is default
- Add `[data-theme="dark"]` class to `<html>` element to toggle dark mode
- CSS custom properties automatically switch via `:root` and `[data-theme="dark"]` rules

### Example Implementation
```javascript
// In React component
const [theme, setTheme] = useState('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```

## Responsive Design

### Breakpoints (Mobile-First)
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px
- **Large Desktop:** > 1400px

### Key Layouts
- **Dashboard Grid:** `320px sidebar | 1fr content` (stacks to 1 col on mobile)
- **Client Portal:** `1fr main | 360px sidebar` (stacks to 1 col on mobile)
- **Exercise Detail:** `1fr instructions | 1fr visuals` (stacks to 1 col on tablet)
- **Card Grid:** `repeat(auto-fill, minmax(280px, 1fr))` (responsive auto-layout)

## Motion & Interactions

### Transitions
- Default: `all 0.2s ease`
- Cubic-bezier for interactive elements: `cubic-bezier(0.4, 0, 0.2, 1)`
- Focus/Hover states: 0.25s for smooth feedback

### Animations
- Pulse animation for recording indicator
- Spin animation for loading states
- Smooth color transitions on theme toggle

## Accessibility

- **Color Contrast:** All text meets WCAG AA standards (4.5:1 for normal, 3:1 for large)
- **Focus Indicators:** 3px glow shadow on interactive elements
- **Dark Mode:** Maintains same contrast ratios and readability
- **Icon + Text:** All icon buttons include descriptive text or title attributes

## Implementation Notes

### For Tailwind + shadcn/ui
- Use CSS custom properties as Tailwind config values where possible
- Primary color should map to Tailwind's `primary` palette
- Orange/Blue map to Tailwind's `warning` and `info` palettes
- Apply `@apply` directives for consistent component styles

### Color Config Example
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: 'hsl(154 26% 35% / <alpha-value>)',
      accent: {
        orange: 'hsl(24 90% 58% / <alpha-value>)',
        blue: 'hsl(198 80% 48% / <alpha-value>)',
      }
    }
  }
}
```
