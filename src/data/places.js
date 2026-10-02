// Rich, researched places (hours, rates, pros) keyed by hobby. Built by
// scripts/build_places.py from the seed files. Hobbies without an entry fall
// back to the thin venues.json list.
import raw from './places.json'
import venues from './venues.json'

export const PLACES = raw
export const KIND_LABEL = {
  // pottery
  studio: 'Studio', school: 'Art school', supply: 'Clay & supplies', gallery: 'Gallery',
  // golf
  course: 'Course', range: 'Driving range', sim: 'Simulator', fitter: 'Club fitter', academy: 'Lessons',
  // shared
  shop: 'Shop', place: 'Place',
}
// Teaching venues first, retail last: the order a beginner needs them in.
export const KIND_ORDER = ['studio', 'school', 'course', 'range', 'sim', 'academy', 'fitter', 'supply', 'shop', 'gallery', 'place']

// A place's own program list, without the free ones (see SESSIONS).
const isFree = (p) => p === 0 || /^\s*free\b/i.test(String(p ?? ''))
export const paidPrograms = (p) => (p.sessions || []).filter((s) => !isFree(s.price))

export function placesFor(hobby) { return PLACES[hobby] || [] }

// One shape for both tiers, so the Places view does not need two code paths.
// Thin venues become kind 'place' with no rates, which is honest: that is all
// we know about them until someone researches the hobby.
// A venue can serve more than one hobby (Fleisher teaches ceramics and eight
// other things), so an optional `hobbies` array widens the match.
const servesHobby = (v, hobby) => v.hobby === hobby || (v.hobbies || []).includes(hobby)

export function allPlacesFor(hobby) {
  const rich = placesFor(hobby)
  if (rich.length) return rich
  return venues.filter((v) => servesHobby(v, hobby)).map((v) => ({ ...v, kind: 'place', thin: true }))
}

export function placeById(id) {
  for (const list of Object.values(PLACES)) { const p = list.find((x) => x.id === id); if (p) return p }
  const v = venues.find((x) => x.id === id)
  return v ? { ...v, kind: 'place', thin: true } : null
}
