// Client-side calendar helpers. No API, no OAuth.
function utc(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}
function esc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildIcs(session, extra = {}) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OpenSeat//Prototype//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${session.id}@openseat.prototype`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(session.start)}`,
    `DTEND:${utc(session.end)}`,
    `SUMMARY:${esc(session.title)} at ${esc(session.venue.name)}`,
    `LOCATION:${esc(session.venue.address)}`,
    `DESCRIPTION:${esc((extra.description || '') + (session.url ? `\nBook: ${session.url}` : ''))}`,
    `URL:${session.url || ''}`,
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadIcs(session, extra) {
  const blob = new Blob([buildIcs(session, extra)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function googleCalendarUrl(session, extra = {}) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${session.title} at ${session.venue.name}`,
    dates: `${utc(session.start)}/${utc(session.end)}`,
    details: (extra.description || '') + (session.url ? `\nBook: ${session.url}` : ''),
    location: session.venue.address,
  })
  if (extra.guests) p.set('add', extra.guests)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
