# PROJ-8: Tour Map Visualization (Touren-Visualisierung)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Pharmacy Customer Database) — pharmacies have addresses for geocoding
- Requires: PROJ-3 (Tour & Appointment Scheduling) — shows appointments for a day/tour on the map

## Overview
A geographic view of a day's or tour's appointments plotted on a map, so trainers and admins can visually validate that the planned route makes geographic sense. This is not AI route optimization — it is a visual aid to help humans spot illogical routing (e.g. going from Innsbruck to Salzburg and back to Innsbruck on the same day).

## User Stories
- As an Admin, I want to see all appointments for a selected trainer on a given day plotted on a map so that I can verify the route is geographically sensible.
- As a Trainer, I want to see my day's stops on a map so that I can plan my actual driving route.
- As an Admin, I want to see appointments numbered in chronological order on the map so that the planned sequence is clear.
- As any user, I want to click a map marker to see the pharmacy name, appointment time, and address so that I can get context without leaving the map.
- As an Admin, I want to view the map for an entire tour (multiple days) so that I can check the regional distribution.

## Acceptance Criteria
- [ ] Map view is accessible from the Appointment List and from the Calendar (via a "View on Map" button)
- [ ] Each appointment is shown as a numbered marker (ordered by time) on the map
- [ ] Clicking a marker shows a popup with: Pharmacy name, Address, Start time, End time, Status
- [ ] The map auto-zooms to fit all markers for the selected day/tour
- [ ] Filter: select a specific trainer and a date (or a tour) to display their appointments
- [ ] Admins can access maps for any trainer; Trainers can only view their own
- [ ] Addresses are geocoded from pharmacy address fields; geocoding failures show a warning icon instead of a marker
- [ ] Map tiles load from a free/open-source provider (OpenStreetMap) — no Google Maps API required for MVP
- [ ] The map is not editable — it is view-only (no drag-and-drop on the map)

## Edge Cases
- What if a pharmacy address cannot be geocoded? → Show a warning next to the appointment in a list below the map; display the marker at city center if city is known.
- What if all appointments for the day are in the same city? → Map zooms to street level for that city; markers are displayed individually.
- What if there are no appointments for the selected day? → Show an empty map with a message: "No appointments for this day."
- What if a pharmacy address has not been entered? → Skip the marker; show the pharmacy in an "unmapped" list below the map.
- What if the tour has 20+ appointments across a large region? → All markers are shown; the map zooms to fit; performance must not degrade.

## Technical Requirements
- Map library: Leaflet.js with OpenStreetMap tiles (free, no API key required)
- Geocoding: Use a free geocoding API (e.g. Nominatim / OpenStreetMap) — rate-limit compliant
- Cache geocoded coordinates in the `apotheken` table (store `lat`, `lng` columns after first lookup)
- Do not re-geocode addresses that already have stored coordinates
- Map is client-side rendered (not SSR)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
