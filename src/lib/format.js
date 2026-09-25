const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtTime(d) {
  let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`
}
export function fmtDay(d) { return `${DAY[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}` }
export function fmtDayLong(d) { return `${DAY_LONG[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}` }
export function fmtPrice(p) { return p == null ? 'See venue' : p === 0 ? 'Free' : `$${p}` }
export function fmtRel(d, now = new Date()) {
  const a = new Date(now); a.setHours(0, 0, 0, 0)
  const b = new Date(d); b.setHours(0, 0, 0, 0)
  const diff = Math.round((b - a) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return DAY_LONG[d.getDay()]
  return fmtDay(d)
}
export function weekdayName(i) { return DAY_LONG[i] }
export function dayKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
