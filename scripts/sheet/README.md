# Live funnel sheet

A Google Sheet that fills in as people use the site: one row per page view and
per Hold my seat tap, plus a **Funnel** tab counting unique visitors who

1. opened the site
2. opened a hobby
3. tapped Hold my seat

## Setup (about 5 minutes, once)

1. Create a new Google Sheet (sheets.new) and name it, e.g. "Kindling funnel".
2. **Extensions → Apps Script.** Delete what is in the editor, paste in all of
   `Code.gs` from this folder, and save.
3. In the function dropdown at the top pick **setup**, press **Run**, and allow
   the permissions it asks for. This creates the Events and Funnel tabs.
4. **Deploy → New deployment.** Type: **Web app**. Execute as: **Me**. Who has
   access: **Anyone**. Press Deploy and copy the **Web app URL** (ends in `/exec`).
5. Put that URL in `SHEET_URL` in `src/lib/track.js` and push.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New
version** so the URL stays the same.

## Notes

- Only rows from `leemoose.github.io` are counted in the funnel. Testing on
  localhost still adds rows to Events, marked with the site, but they are not
  counted.
- A "person" is one browser. The same person on their phone and laptop counts
  twice; clearing their browser data makes them new.
- The URL is public in the page source, so someone could post junk rows to it.
  For a small test that is an acceptable risk.
- PostHog still gets every event, with more detail, if you need anything the
  sheet does not show.
