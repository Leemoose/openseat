// Rich, researched places (hours, rates, pros) keyed by hobby. Built by
// scripts/build_places.py from the seed files. Hobbies without an entry fall
// back to the thin venues.json list.
import raw from './places.json'

export const PLACES = raw
export const KIND_LABEL = {
  course: 'Course', range: 'Driving range', sim: 'Simulator', shop: 'Shop', fitter: 'Club fitter', academy: 'Lessons', place: 'Place',
}
export const KIND_ORDER = ['course', 'range', 'sim', 'academy', 'fitter', 'shop', 'place']

export function placesFor(hobby) { return PLACES[hobby] || [] }
export function placeById(id) {
  for (const list of Object.values(PLACES)) { const p = list.find((x) => x.id === id); if (p) return p }
  return null
}
