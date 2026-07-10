---
paths:
  - "mobile/**"
---

# Mobile Development Rules (React Native / Expo)

> Active only when `/setup` enabled Mobile. The web app keeps `.claude/rules/frontend.md`; this file governs the `mobile/` Expo app.

## Framework
- Use **Expo** (managed workflow) with **expo-router** for navigation
- TypeScript everywhere; share types and the API client from `packages/shared`, never re-declare them
- Do NOT import web-only components (shadcn/ui, HTML elements) into `mobile/` — they don't render in React Native

## Styling
- Use **NativeWind** (Tailwind for React Native) for styling — `className` on RN primitives
- Keep the design tokens (colors, spacing, typography) in sync with the web app; source them from `packages/shared` where practical
- Use a component library suited to RN (e.g. Tamagui or gluestack) for primitives; do not port shadcn/ui

## Components & UX
- Build for touch: adequate tap targets, no hover-only affordances
- Handle safe areas (`react-native-safe-area-context`), notches, and keyboard avoidance
- Implement loading, error, and empty states for every screen
- Test on both iOS and Android — platform differences are real (fonts, shadows, back gesture)

## Data & Auth
- Talk to the backend through the shared API client (`packages/shared`), same contracts as web
- Store tokens/secrets in secure storage (`expo-secure-store`), never in AsyncStorage plaintext
- Enforce authorization on the backend / access rules — the client is untrusted

## Hardware & Native
- Access native features via Expo modules (camera, notifications, secure store, etc.)
- Anything requiring a custom native module needs a development build (EAS), not Expo Go
- Declare permissions and data usage honestly for App Store / Play privacy labels (see `docs/STACK.md`)

## Build & Release
- Builds go through **EAS Build**; distribution via TestFlight (iOS) and Play tracks (Android)
- Bump `version` + `buildNumber`/`versionCode` in `app.json` per release
- See `/deploy` (Mobile Deploy section) for the full pipeline

Read `.claude/rules/general.md` for project-wide conventions.
