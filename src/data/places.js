// Rich, researched places (hours, rates, pros) keyed by hobby. Built by
// scripts/build_places.py from the seed files. Hobbies without an entry fall
// back to the thin venues.json list.
import raw from './places.json'
import venues from './venues.json'

export const PLACES = raw
export const KIND_LABEL = {
  course: 'Course', range: 'Driving range', sim: 'Simulator', shop: 'Shop', fitter: 'Club fitter', academy: 'Lessons', place: 'Place',
}
export const KIND_ORDER = ['course', 'range', 'sim', 'academy', 'fitter', 'shop', 'place']

export function placesFor(hobby) { return PLACES[hobby] || [] }

// One shape for both tiers, so the Places view does not need two code paths.
// Thin venues become kind 'place' with no rates, which is honest: that is all
// we know about them until someone researches the hobby.
export function allPlacesFor(hobby) {
  const rich = placesFor(hobby)
  if (rich.length) return rich
  return venues.filter((v) => v.hobby === hobby).map((v) => ({ ...v, kind: 'place', thin: true }))
}

export function placeById(id) {
  for (const list of Object.values(PLACES)) { const p = list.find((x) => x.id === id); if (p) return p }
  const v = venues.find((x) => x.id === id)
  return v ? { ...v, kind: 'place', thin: true } : null
}
