// The four launch hobbies get full depth. The "more" set is thinner and says so.
export const HOBBIES = [
  { id: 'pottery', name: 'Pottery', blurb: 'Wheel nights, clay dates, open studio.', tint: '#c8552f', glyph: '◍', primary: true },
  { id: 'climbing', name: 'Climbing', blurb: 'Intro courses, belay basics, bouldering.', tint: '#3f6b4a', glyph: '▲', primary: true },
  { id: 'boardgames', name: 'Board games', blurb: 'Open tables, Magic, weekly D&D.', tint: '#2f4f8f', glyph: '⚄', primary: true },
  { id: 'guitar', name: 'Guitar', blurb: 'Group classes and jams.', tint: '#8a5a1f', glyph: '♪', primary: true },
  { id: 'art', name: 'Art & galleries', blurb: 'First Friday, workshops, openings.', tint: '#7a3e6b', glyph: '✦', primary: false },
  { id: 'golf', name: 'Golf', blurb: 'Courses, ranges, sims, lessons.', tint: '#4a6b2f', glyph: '⛳', primary: true },
  { id: 'cycling', name: 'Cycling', blurb: 'Shop rides and repair clinics.', tint: '#2c6e7a', glyph: '◎', primary: false },
]

export const hobbyById = (id) => HOBBIES.find((h) => h.id === id)
