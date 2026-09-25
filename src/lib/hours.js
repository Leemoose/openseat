// Tolerant hours parsing. Hours arrive as a free string or an object keyed by day.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const LONG = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function toMinutes(s) {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(s)
  if (!m) return null
  let h = +m[1]; const min = +(m[2] || 0); const ap = (m[3] || '').toLowerCase().replace(/\./g, '')
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (!ap && h <= 6) h += 12 // "6-9" without am/pm reads as evening
  return h * 60 + min
}

// Returns { open, close } minutes for a day string like "7:00am - 9:00pm", or null.
export function parseRange(str) {
  if (!str || typeof str !== 'string') return null
  if (/closed/i.test(str)) return { closed: true }
  const parts = str.split(/\s*(?:-|–|—|to)\s*/i)
  if (parts.length < 2) return null
  const o = toMinutes(parts[0]); const c = toMinutes(parts[1])
  if (o == null || c == null) return null
  return { open: o, close: c <= o ? c + 1440 : c }
}

export function todayHours(hours, now = new Date()) {
  if (!hours) return null
  const d = now.getDay()
  if (typeof hours === 'string') return { text: hours, range: null }
  const key = Object.keys(hours).find((k) => {
    const kk = k.toLowerCase()
    return kk === DAYS[d] || kk === LONG[d] || kk.startsWith(DAYS[d])
      || (/mon.*fri|weekday/i.test(kk) && d >= 1 && d <= 5)
      || (/sat.*sun|weekend/i.test(kk) && (d === 0 || d === 6))
      || /daily|every ?day|all/i.test(kk)
  })
  if (!key) return null
  const text = hours[key]
  return { text: typeof text === 'string' ? text : JSON.stringify(text), range: parseRange(text), key }
}

export function isOpenNow(hours, now = new Date()) {
  const t = todayHours(hours, now)
  if (!t || !t.range || t.range.closed) return t && t.range && t.range.closed ? false : null
  const m = now.getHours() * 60 + now.getMinutes()
  return m >= t.range.open && m < t.range.close
}

export function hoursList(hours) {
  if (!hours) return []
  if (typeof hours === 'string') return [['Hours', hours]]
  return Object.entries(hours).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
}
