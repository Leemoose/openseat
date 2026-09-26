// A "series" is the thing this product is actually about: a class that repeats.
// SESSIONS is a 28-day expansion, so the same Tuesday class shows up four times.
// Collapsing back to one row per (venue, title) is what makes "the Tuesday thing"
// visible instead of burying it in a date list.
import { SESSIONS } from '../data/sessions.js'
import { placesFor } from '../data/places.js'
import venues from '../data/venues.json'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

// [2,4] -> "Tue & Thu"; [1,2,3,4,5] -> "Weekdays"; [0,6] -> "Weekends"
function cadence(days) {
  const d = [...days].sort((a, b) => a - b)
  if (d.length === 7) return 'Daily'
  if (d.length === 5 && d.every((x) => x >= 1 && x <= 5)) return 'Weekdays'
  if (d.length === 2 && d[0] === 0 && d[1] === 6) return 'Weekends'
  const names = d.map((x) => DAY_SHORT[x])
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

export function buildSeries(sessions = SESSIONS) {
  const m = new Map()
  for (const s of sessions) {
    const key = `${s.venueId}|${s.title}`
    let e = m.get(key)
    if (!e) {
      e = {
        id: `${s.venueId}__${slug(s.title)}`,
        venueId: s.venueId, venue: s.venue, hobby: s.hobby, title: s.title,
        price: s.price, cap: s.cap, level: s.level, source: s.source, url: s.url, note: s.note,
        recurring: s.recurring, days: new Set(), times: new Set(), instances: [],
      }
      m.set(key, e)
    }
    e.instances.push(s)
    if (s.recurring) e.days.add(s.weekday)
    e.times.add(s.time)
    // Keep the cheapest observed price: the same class can differ by day.
    if (s.price != null && (e.price == null || s.price < e.price)) e.price = s.price
  }
  return [...m.values()].map((e) => {
    const days = [...e.days].sort((a, b) => a - b)
    const times = [...e.times].sort()
    return {
      ...e,
      days, times,
      next: e.instances[0],
      count: e.instances.length,
      // "Every Tue & Thu" for a repeating class, the date itself for a one-off.
      cadence: e.recurring && days.length ? `Every ${cadence(days)}` : null,
      // One time reads cleanly; several means the class moves, so say so.
      timeLabel: times.length === 1 ? null : `${times.length} times`,
      beginner: e.level === 'First time welcome',
    }
  }).sort((a, b) => a.next.start - b.next.start)
}

export const SERIES = buildSeries()

export function seriesFor(hobby) { return SERIES.filter((s) => s.hobby === hobby) }
export const seriesById = (id) => SERIES.find((s) => s.id === id)

// Everything a hobby tile or hobby header needs to answer "is this worth a click":
// how many real things there are, and what it costs to try one.
export function hobbyStats(hobby) {
  const series = seriesFor(hobby)
  const rich = placesFor(hobby)
  const thin = venues.filter((v) => v.hobby === hobby)
  const places = rich.length ? rich : thin
  const prices = [
    ...series.map((s) => s.price),
    ...rich.map((p) => p.fromPrice),
  ].filter((p) => p != null)
  const paid = prices.filter((p) => p > 0)
  return {
    series: series.length,
    places: places.length,
    beginner: series.filter((s) => s.beginner).length,
    free: series.some((s) => s.price === 0),
    // "Free" is a stronger hook than "$0", so report both and let the tile choose.
    from: paid.length ? Math.min(...paid) : null,
  }
}
