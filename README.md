# Kindling

Fake-door MVP of a hobby-first discovery app for Philadelphia: recurring sessions at real studios, gyms and shops, read from the calendars they already publish. The one thing it measures is how many visitors tap **Hold my seat** on a session (tracked in PostHog, followed by a Google Form).

Static site, no backend. Everything a visitor does stays in their browser.

- `npm install && npm run dev` to run locally
- Pushes to `main` deploy to GitHub Pages via `.github/workflows/pages.yml`
- Data lives in `src/data/`: `venues.json` (real, geocoded), `sessions.js` (recurring templates with a source label per session), `places.json` (researched venues)
