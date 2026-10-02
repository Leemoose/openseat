// How many meetings a course commits you to, read from its title and note.
// Venues say it a dozen ways ("8-Week", "(5 Sessions)", "Four sessions",
// "Three-Day Intensive", "9/14/2026-11/16/2026"), and the price they publish is
// for the whole run. Returns null when nothing says, so the price is treated as
// a single event rather than divided by a guess.
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
const N = `(\\d{1,2}|${Object.keys(WORDS).join('|')})`
const num = (s) => WORDS[s.toLowerCase()] ?? +s

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
const MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?'

// Days between the two ends of a date range, or null if there is none.
function rangeDays(t) {
  let m = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t)
  if (m) return (new Date(+m[6], m[4] - 1, +m[5]) - new Date(+m[3], m[1] - 1, +m[2])) / 864e5
  m = new RegExp(`${MON}\\s+(\\d{1,2})\\s*(?:-|–|to|through)\\s*(?:${MON}\\s+)?(\\d{1,2})\\b`, 'i').exec(t)
  if (m) {
    const a = new Date(2026, MONTHS[m[1].toLowerCase()], +m[2])
    const b = new Date(2026, MONTHS[(m[3] || m[1]).toLowerCase()], +m[4])
    if (b < a) b.setFullYear(2027)
    return (b - a) / 864e5
  }
  return null
}

export function countMeetings(title = '', note = '') {
  const t = `${title} ${note || ''}`
  // The length of the run comes first: "6 weeks; prerequisite 3 sessions of
  // 6-week classes" is a six-meeting course, not a three-meeting one.
  let m = new RegExp(`\\b${N}[\\s-]*(?:week|wk)s?\\b`, 'i').exec(t)
  if (m) return num(m[1])
  m = new RegExp(`\\b${N}[\\s-]*(?:sessions?|meetings?|classes)\\b`, 'i').exec(t)
  if (m) return num(m[1])
  m = new RegExp(`\\b${N}[\\s-]*days?\\b`, 'i').exec(t)
  if (m) return num(m[1])
  const d = rangeDays(t)
  if (d != null && d > 0) return d < 7 ? d + 1 : Math.floor(d / 7) + 1
  return null
}
