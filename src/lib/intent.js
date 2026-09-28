// Paid intent and attribution, in one file so there is exactly one place to
// change the price, the form and the promise.
//
// Why this exists: the product's whole revenue question is "would anyone pay",
// and until now it could not answer it. The pricing poll wrote to localStorage
// and nothing else, so no answer had ever left a browser. Everything here is
// built so that one constant below turns a prototype gesture into a real
// signal, with no backend.
import { getState, updateStore } from './store.js'

// What a held seat costs. $30 is the ticket price the research calls optimal
// for this audience; change it here and the whole site follows.
export const HOLD_PRICE = 30

// Set this to a Tally or Google Form URL and every "hold my seat" tap opens it
// with the session prefilled. Leave it empty and the tap falls back to a
// mailto, which is lower volume but still reaches a real inbox. One of the two
// has to be live or the test collects nothing, which was the old failure.
export const HOLD_FORM_URL = ''
export const HOLD_EMAIL = 'connorito@gmail.com'

// The promise, said once here and reused, so the hero, the pricing page and
// the hold button cannot drift apart.
export const PROMISE = 'The only place in Philadelphia that tells you what a first class actually costs.'

export function holdLink(session) {
  const label = `${session.title} at ${session.venue?.name || 'a venue'}`
  const when = session.date ? ` on ${session.date}` : ''
  if (HOLD_FORM_URL) {
    const u = new URL(HOLD_FORM_URL)
    u.searchParams.set('session', label)
    u.searchParams.set('price', String(HOLD_PRICE))
    return u.toString()
  }
  const subject = encodeURIComponent(`Hold my seat: ${label}`)
  const body = encodeURIComponent(
    `I want a seat held for ${label}${when}.\n\n`
    + `I understand this is a prototype and nothing is booked yet.\n\n`
    + `My name:\nBest email:\n`,
  )
  return `mailto:${HOLD_EMAIL}?subject=${subject}&body=${body}`
}

export function recordHold(session) {
  const holds = getState().holds || []
  updateStore({ holds: [{ sessionId: session.id, price: HOLD_PRICE, at: Date.now() }, ...holds] })
}

// Attribution. Every path out of this site used to be an untracked _blank, so
// a fill could not be counted and there was nothing to show a venue.
export function recordClickOut(placeId, sessionId) {
  if (!placeId) return
  const clicks = getState().clicks || []
  updateStore({ clicks: [{ placeId, sessionId: sessionId || null, at: Date.now() }, ...clicks].slice(0, 200) })
}

export function recordWent(placeId, sessionId) {
  if (!placeId) return
  const went = getState().went || []
  if (went.some((w) => w.placeId === placeId && w.sessionId === (sessionId || null))) return
  updateStore({ went: [{ placeId, sessionId: sessionId || null, at: Date.now() }, ...went] })
}

export const clicksFor = (st, placeId) => (st.clicks || []).filter((c) => c.placeId === placeId).length
export const wentFor = (st, placeId) => (st.went || []).filter((c) => c.placeId === placeId).length

// A click out that has not been answered yet, so the page can ask "did you
// book?" when the visitor comes back. Only the most recent one, and only for
// the place being looked at.
export function pendingClick(st, placeId) {
  const c = (st.clicks || []).find((x) => x.placeId === placeId)
  if (!c) return null
  const answered = (st.went || []).some((w) => w.placeId === placeId && w.at > c.at)
  return answered ? null : c
}
