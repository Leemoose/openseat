// Recurring session templates, expanded over the next 28 days at runtime so the
// demo always looks current. Each template names its source and how real it is:
//   feed     read from the venue's own public schedule endpoint
//   snapshot read from the venue's site or scheduler on 2026-09-24, then hand-entered
//   sample   plausible for this venue, not verified; replace when the adapter runs
//
// Templates for a venue the adapter covers are suppressed (see FEED_VENUES
// below). They are deliberately left in place rather than deleted: if that
// venue's feed ever comes back empty, these reappear, so a bad fetch degrades
// to stale-but-labelled instead of an empty hobby page.
import venues from './venues.json'
import places from './places.json'
import feed from './feed_sessions.json'

// weekday: 0=Sun ... 6=Sat. time is "HH:MM" local. price 0 = free.
const T = [
  // Pottery
  { v: 'yayclay', title: 'Clay Date, Retro Room (evening)', days: [5, 6], time: '19:00', mins: 120, price: 90, cap: 8, level: 'First time welcome', source: 'snapshot', note: 'Public Acuity scheduler. Two people share a wheel, drinks allowed, 21+.', url: 'https://yayclay.com' },
  { v: 'yayclay', title: 'Clay Date, Retro Room (afternoon)', days: [1, 2, 3, 4], time: '14:00', mins: 120, price: 80, cap: 8, level: 'First time welcome', source: 'snapshot', note: 'Cheaper weekday afternoon slot on the same scheduler.', url: 'https://yayclay.com' },
  { v: 'yayclay', title: 'Wine & Clay: tasting and throwing', days: [4], time: '19:00', mins: 150, price: 115, cap: 10, level: 'First time welcome', source: 'snapshot', note: 'Listed on the scheduler at $115 per person.', url: 'https://yayclay.com' },
  { v: 'yayclay', title: 'Open Studio Time', days: [0], time: '12:00', mins: 180, price: 25, cap: 12, level: 'Some experience', source: 'sample', note: 'Open studio appears on the scheduler; price and day are a guess.', url: 'https://yayclay.com' },
  { v: 'clay-studio', title: 'Try Clay: wheel sampler', days: [3], time: '18:30', mins: 120, price: 75, cap: 10, level: 'First time welcome', source: 'sample', note: 'The Clay Studio runs public wheel samplers; day and price unverified.', url: 'https://www.theclaystudio.org' },
  { v: 'clay-studio', title: 'Date Night on the Wheel', days: [6], time: '18:00', mins: 120, price: 150, cap: 6, level: 'First time welcome', source: 'sample', note: 'Price shown per pair.', url: 'https://www.theclaystudio.org' },
  { v: 'pottery-gym', title: 'Beginner wheel drop-in', days: [2], time: '19:00', mins: 120, price: 65, cap: 8, level: 'First time welcome', source: 'sample', note: 'The Pottery Gym lists classes and ticketed events on Squarespace.', url: 'https://www.thepotterygym.com' },
  { v: 'pottery-gym', title: 'Handbuilding open table', days: [0], time: '13:00', mins: 120, price: 45, cap: 10, level: 'First time welcome', source: 'sample', url: 'https://www.thepotterygym.com' },
  { v: 'fleisher', title: 'Ceramics open studio', days: [6], time: '10:00', mins: 180, price: 20, cap: 14, level: 'Some experience', source: 'sample', note: 'Fleisher runs The Events Calendar on WordPress; the feed was not readable this run.', url: 'https://fleisher.org' },

  // Climbing
  { v: 'prg-fishtown', title: 'Introduction to Top Rope', days: [1, 3, 4], time: '18:00', mins: 120, price: 39, cap: 8, level: 'First time welcome', source: 'snapshot', note: 'Read from PRG\'s public events feed on 2026-09-24 (The Events Calendar REST API).', url: 'https://www.philarockgym.com' },
  { v: 'prg-wyncote', title: 'Introduction to Top Rope', days: [3], time: '18:00', mins: 120, price: 39, cap: 8, level: 'First time welcome', source: 'snapshot', note: 'Same public feed.', url: 'https://www.philarockgym.com' },
  { v: 'prg-fishtown', title: 'Belay Basics', days: [6], time: '11:00', mins: 90, price: 39, cap: 8, level: 'First time welcome', source: 'sample', url: 'https://www.philarockgym.com' },
  { v: 'prg-fishtown', title: 'Bouldering 101', days: [2], time: '19:00', mins: 90, price: 30, cap: 10, level: 'First time welcome', source: 'sample', url: 'https://www.philarockgym.com' },
  { v: 'reach', title: 'Learn the Ropes', days: [0], time: '14:00', mins: 120, price: 45, cap: 8, level: 'First time welcome', source: 'sample', url: 'https://reachclimbing.com' },

  // Board games
  { v: 'philly-game-shop', title: 'Open board game night', days: [4], time: '18:00', mins: 240, price: 0, cap: 24, level: 'First time welcome', source: 'snapshot', note: 'Listed on the shop\'s events page (Squarespace).', url: 'https://www.phillygameshop.com/events' },
  { v: 'philly-game-shop', title: 'RPG evening: drop-in table', days: [2], time: '18:30', mins: 210, price: 0, cap: 12, level: 'First time welcome', source: 'snapshot', url: 'https://www.phillygameshop.com/events' },
  { v: 'queen-rook', title: 'Newcomer table (cafe open play)', days: [3], time: '19:00', mins: 180, price: 5, cap: 16, level: 'First time welcome', source: 'sample', note: 'Game cafe with a library; table fee is a guess.', url: 'https://www.queenandrookcafe.com' },
  { v: 'redcaps', title: 'Friday Night Magic', days: [5], time: '19:00', mins: 240, price: 10, cap: 32, level: 'Some experience', source: 'snapshot', note: 'Redcap\'s runs daily events with a Magic focus; FNM is a Wizards program.', url: 'https://redcapscorner.com' },
  { v: 'redcaps', title: 'D&D Adventurers League', days: [3], time: '18:30', mins: 210, price: 0, cap: 18, level: 'First time welcome', source: 'snapshot', url: 'https://redcapscorner.com' },
  { v: 'dark-depths', title: 'Commander night', days: [1], time: '18:00', mins: 240, price: 5, cap: 20, level: 'Some experience', source: 'sample', note: 'Events scheduled through the shop\'s Discord.', url: 'https://darkdepthsgames.com' },

  // Guitar
  { v: 'classical-guitar-store', title: 'Beginner group class', days: [2], time: '18:00', mins: 60, price: 30, cap: 6, level: 'First time welcome', source: 'sample', note: 'The shop teaches lessons and hosts the Philadelphia Classical Guitar Society.', url: 'http://www.classicalguitarstore.com/' },
  { v: 'classical-guitar-store', title: 'Classical Guitar Society open play', days: [0], time: '15:00', mins: 120, price: 0, cap: 20, level: 'Some experience', source: 'sample', url: 'http://www.classicalguitarstore.com/' },
  { v: 'dipinto', title: 'Saturday in-store jam', days: [6], time: '16:00', mins: 120, price: 0, cap: 15, level: 'Some experience', source: 'sample', note: 'DiPinto lists events on a Squarespace calendar.', url: 'https://www.dipintoguitars.com/philly-store' },
  { v: 'russo', title: 'Adult beginner guitar (group)', days: [3], time: '18:00', mins: 60, price: 25, cap: 8, level: 'First time welcome', source: 'sample', url: 'https://www.russomusic.com/pages/guitar-store-philadelphia-pa' },
  { v: 'russo', title: 'Pedal petting zoo', days: [6], time: '13:00', mins: 120, price: 0, cap: 20, level: 'First time welcome', source: 'sample', url: 'https://www.russomusic.com/pages/guitar-store-philadelphia-pa' },
  { v: 'settlement', title: 'Adult beginner guitar', days: [1], time: '19:00', mins: 60, price: 35, cap: 8, level: 'First time welcome', source: 'sample', url: 'https://www.settlementmusic.org' },

  // Art, golf, cycling (thinner on purpose)
  { v: 'art-in-wood', title: 'Intro to woodturning', days: [6], time: '10:00', mins: 180, price: 95, cap: 6, level: 'First time welcome', source: 'sample', url: 'https://museumforartinwood.org' },
  { v: 'trophy-bikes', title: 'Fix-a-flat clinic', days: [6], time: '10:00', mins: 60, price: 0, cap: 10, level: 'First time welcome', source: 'sample', url: 'https://trophybikes.com' },
  { v: 'bicycle-therapy', title: 'Sunday shop ride', days: [0], time: '08:00', mins: 120, price: 0, cap: 20, level: 'Some experience', source: 'sample', url: 'https://bicycletherapy.com' },
]

// One-off dated events (real dates from the organizer's site).
const ONE_OFFS = [
  { v: 'old-city-first-friday', title: 'First Friday, Old City', date: '2026-10-02', time: '17:00', mins: 240, price: 0, cap: 999, level: 'First time welcome', source: 'feed', note: 'Dates from oldcitydistrict.org. 30+ galleries open new shows and stay open late.', url: 'https://www.oldcitydistrict.org/first-friday' },
  { v: 'old-city-first-friday', title: 'First Friday, Old City', date: '2026-11-06', time: '17:00', mins: 240, price: 0, cap: 999, level: 'First time welcome', source: 'feed', url: 'https://www.oldcitydistrict.org/first-friday' },
  { v: 'old-city-first-friday', title: 'First Friday, Old City', date: '2026-12-04', time: '17:00', mins: 240, price: 0, cap: 999, level: 'First time welcome', source: 'feed', url: 'https://www.oldcitydistrict.org/first-friday' },
  { v: 'arch-enemy', title: 'First Friday opening reception', date: '2026-10-02', time: '18:00', mins: 180, price: 0, cap: 999, level: 'First time welcome', source: 'sample', url: 'https://www.archenemyarts.com' },
]

const RICH = Object.values(places).flat()
const venueById = Object.fromEntries([...venues, ...RICH].map((v) => [v.id, v]))

// Parse "Tuesdays", "Tue/Thu", "Mon-Fri", "Weekends" into weekday indices.
const DAYNAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
function parseDays(str) {
  if (!str) return []
  const t = String(str).toLowerCase()
  if (/daily|every ?day/.test(t)) return [0, 1, 2, 3, 4, 5, 6]
  const out = new Set()
  if (/weekend/.test(t)) { out.add(0); out.add(6) }
  if (/weekday/.test(t)) [1, 2, 3, 4, 5].forEach((d) => out.add(d))
  const range = /(sun|mon|tue|wed|thu|fri|sat)[a-z]*\s*(?:-|–|to|through)\s*(sun|mon|tue|wed|thu|fri|sat)/.exec(t)
  if (range) { let a = DAYNAMES.indexOf(range[1]); const b = DAYNAMES.indexOf(range[2]); for (let i = 0; i < 7; i++) { out.add(a); if (a === b) break; a = (a + 1) % 7 } }
  else for (const m of t.matchAll(/(sun|mon|tue|wed|thu|fri|sat)/g)) out.add(DAYNAMES.indexOf(m[1]))
  return [...out]
}
// "6:30pm", "6 pm", "6:30 PM - 8:30 PM" -> "18:30" (first time only)
function parseTime(str) {
  if (!str) return null
  const m = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(String(str))
  if (!m) return null
  let h = +m[1]; const min = m[2] || '00'; const ap = (m[3] || '').toLowerCase().replace(/\./g, '')
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (!ap && h <= 6) h += 12
  return `${String(h).padStart(2, '0')}:${min}`
}
function priceNum(p) {
  if (typeof p === 'number') return p
  if (typeof p === 'string') { const m = /(\d+(?:\.\d+)?)/.exec(p); return m ? +m[1] : null }
  return null
}
for (const pl of RICH) {
  for (const s of pl.sessions || []) {
    const days = parseDays(s.day); const time = parseTime(s.time)
    if (!days.length || !time) continue
    // Seasonal camps and closed enrollment series are programs, not weekly sessions.
    if (/seasonal|camp|closed|summer|june|july/i.test(`${s.title} ${s.note || ''}`)) continue
    T.push({ v: pl.id, title: s.title, days, time, mins: 90, price: priceNum(s.price), cap: 999, level: /beginner|intro|clinic|learn|new/i.test(s.title + ' ' + (s.note || '')) ? 'First time welcome' : 'Some experience', source: 'snapshot', note: [s.note, pl.verified && `Read from ${new URL(pl.url || 'https://x.invalid').hostname.replace('www.', '')} on ${pl.verified}.`].filter(Boolean).join(' '), url: pl.url })
  }
}

function pad(n) { return String(n).padStart(2, '0') }
function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Deterministic pseudo-random "seats taken" so the demo feels alive but stable per session id.
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0) }

function make(tpl, date) {
  const venue = venueById[tpl.v]
  const id = `${tpl.v}__${tpl.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}__${date}`
  const start = new Date(`${date}T${tpl.time}:00`)
  const end = new Date(start.getTime() + tpl.mins * 60000)
  const taken = tpl.cap >= 999 ? 0 : Math.min(tpl.cap - 1, (hash(id) % Math.max(2, Math.round(tpl.cap * 0.8))))
  return {
    id, venueId: tpl.v, venue, hobby: venue.hobby, title: tpl.title, start, end, date, time: tpl.time, mins: tpl.mins,
    price: tpl.price, cap: tpl.cap, taken, level: tpl.level, source: tpl.source, note: tpl.note, url: tpl.url,
    recurring: !tpl.date, weekday: start.getDay(),
  }
}

// Venues whose calendar we actually read. Anything hand-entered for these is
// suppressed: the product's claim is that we do not keep a second listing, so
// the adapter's output has to win rather than sit alongside a stale copy.
const FEED_VENUES = new Set(feed.sessions.map((f) => f.venueId))
const FETCHED = Object.fromEntries(feed.sources.map((s) => [s.base.replace(/^https?:\/\/(www\.)?/, ''), s]))

function feedSessions() {
  // A title that appears three or more times in the window is a standing
  // fixture, not a one-off, which is what lets it group into a series.
  const counts = new Map()
  for (const f of feed.sessions) {
    const k = `${f.venueId}|${f.title}`
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  const out = []
  for (const f of feed.sessions) {
    const venue = venueById[f.venueId]
    if (!venue) continue
    const start = new Date(f.start)
    const end = new Date(f.end || f.start)
    if (Number.isNaN(start.getTime())) continue
    const host = (() => { try { return new URL(f.url).hostname.replace('www.', '') } catch { return null } })()
    const src = host && FETCHED[host]
    out.push({
      id: `feed__${f.venueId}__${f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}__${localDate(start)}`,
      venueId: f.venueId, venue, hobby: f.hobby, title: f.title,
      start, end, date: localDate(start),
      time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      mins: Math.max(30, Math.round((end - start) / 60000)) || 60,
      price: f.price,
      // The calendar does not publish capacity, so we do not invent one.
      cap: null, taken: 0,
      level: f.level, source: 'feed', url: f.url,
      note: src ? `Read from ${host} on ${String(src.fetched).slice(0, 10)}.` : undefined,
      recurring: (counts.get(`${f.venueId}|${f.title}`) || 0) >= 3,
      weekday: start.getDay(),
    })
  }
  return out
}

export function buildSessions(days = 28, from = new Date()) {
  const out = []
  const start = new Date(from); start.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const ds = localDate(d)
    for (const t of T) if (t.days.includes(d.getDay()) && !FEED_VENUES.has(t.v)) out.push(make(t, ds))
  }
  for (const o of ONE_OFFS) {
    const d = new Date(`${o.date}T00:00:00`)
    if (d >= start && !FEED_VENUES.has(o.v)) out.push(make(o, o.date))
  }
  out.push(...feedSessions())
  // Drop sessions already in the past today.
  const now = from.getTime()
  return out.filter((s) => s.end.getTime() > now).sort((a, b) => a.start - b.start)
}

export const SESSIONS = buildSessions()
export const sessionById = (id) => SESSIONS.find((s) => s.id === id)

export const SOURCE_LABEL = { feed: 'Live feed', snapshot: 'Snapshot', sample: 'Sample' }
