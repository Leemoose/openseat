# OpenSeat

Prototype of a hobby-first local discovery app for Philadelphia: recurring sessions at real studios, gyms and shops, read from the calendars they already publish, plus an "open seat" layer so someone already going can hold a seat for someone new.

Static site, no backend. Everything a visitor does stays in their browser.

- `npm install && npm run dev` to run locally
- Pushes to `main` deploy to GitHub Pages via `.github/workflows/pages.yml`
- Data lives in `src/data/`: `venues.json` (real, geocoded), `sessions.js` (recurring templates with a source label per session), `gear.json` (Reverb snapshot), `people.js` and `openseats.js` (invented)
