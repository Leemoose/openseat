// One flat client-side index over everything a visitor might type: a hobby, a
// venue name, a class, a neighborhood. No backend, so this is built once at
// module load and scored with plain string matching.
import { HOBBIES } from '../data/hobbies.js'
import { allPlacesFor, KIND_LABEL } from '../data/places.js'
import { SERIES } from './series.js'

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() }

function build() {
  const out = []
  for (const h of HOBBIES) {
    out.push({ type: 'hobby', id: h.id, label: h.name, sub: h.blurb, to: `/h/${h.id}`, tint: h.tint, hay: norm(`${h.name} ${h.blurb}`) })
  }
  for (const h of HOBBIES) {
    for (const p of allPlacesFor(h.id)) {
      out.push({
        type: 'place', id: p.id, label: p.name,
        sub: `${KIND_LABEL[p.kind] || 'Place'} · ${h.name}`,
        to: `/p/${p.id}`, tint: h.tint, hay: norm(`${p.name} ${p.address} ${KIND_LABEL[p.kind]} ${h.name}`),
      })
    }
  }
  for (const s of SERIES) {
    const h = HOBBIES.find((x) => x.id === s.hobby)
    out.push({
      type: 'series', id: s.id, label: s.title,
      sub: `${s.venue.name} · ${s.cadence || 'One-off'}`,
      to: `/s/${s.next.id}`, tint: h?.tint, hay: norm(`${s.title} ${s.venue.name} ${s.level} ${h?.name}`),
    })
  }
  return out
}

const INDEX = build()

// Prefix-on-a-word beats mid-word, whole-label beats partial, and hobbies float
// to the top because they are the cheapest useful answer to a vague query.
const TYPE_BONUS = { hobby: 30, place: 12, series: 8, hood: 16 }

export function search(q, limit = 8) {
  const query = norm(q)
  if (query.length < 2) return []
  const terms = query.split(' ')
  const hits = []
  for (const e of INDEX) {
    let score = 0
    for (const t of terms) {
      const at = e.hay.indexOf(t)
      if (at < 0) { score = -1; break }
      if (e.hay === t) score += 100
      else if (at === 0) score += 40
      else if (e.hay[at - 1] === ' ') score += 25
      else score += 8
    }
    if (score < 0) continue
    hits.push({ ...e, score: score + (TYPE_BONUS[e.type] || 0) - e.label.length * 0.1 })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export const TYPE_LABEL = { hobby: 'Hobby', place: 'Place', series: 'Class', hood: 'Area' }
