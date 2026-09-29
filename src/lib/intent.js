// Paid intent and attribution, in one file so there is exactly one place to
// change the offer, the form and the promise.
//
// Why this exists: the product's whole revenue question is "would anyone pay",
// and until now it could not answer it. The pricing poll wrote to localStorage
// and nothing else, so no answer had ever left a browser. Everything here is
// built so that one constant turns a prototype gesture into a real signal,
// with no backend.
import { getState, updateStore } from './store.js'
import { track, variant, SUB_PRICE, FEE_RATE } from './track.js'

// Set this to a Tally or Google Form URL and every "hold my seat" tap opens it
// with the session and the price they saw prefilled. Leave it empty and the
// tap falls back to a mailto, which is lower volume but still reaches a real
// inbox. One of the two has to be live or the test collects nothing, which
// was the old failure.
export const HOLD_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfC8qogMJR1EI0YlXLU56w61ViD4gMKQ27hu_XUU0y5rcl2CQ/viewform'
// Google Forms prefill parameters. The ids come from the form's own markup
// (a new question gets a new id; re-read them if the form is rebuilt). The
// email, beta-tester and free-text questions are left for the visitor.
const FORM_FIELDS = { session: 'entry.2068288782', price: 'entry.363416346' }
export const HOLD_EMAIL = 'connorito@gmail.com'

// The promise, said once here and reused, so the hero, the pricing page and
// the hold button cannot drift apart.
export const PROMISE = 'The only place in Philadelphia that tells you what a first class actually costs.'

// The price a visitor is shown, which depends on the arm they were dealt.
//
//   sub  "$10/month, hold as many seats as you like"
//   fee  "5% of the class price per seat", so $2.25 on a $45 class
//
// Both arms sell the same thing (a seat held for you). Only the price model
// differs, which is what the experiment isolates. The fee arm has no dollar
// figure when a venue publishes no price, and says so rather than inventing
// one.
export function offerFor(session) {
  const v = variant()
  const classPrice = typeof session?.price === 'number' ? session.price : null
  if (v === 'sub') {
    return {
      variant: v,
      amount: SUB_PRICE,
      unit: '/month',
      label: `$${SUB_PRICE}/month`,
      button: `Hold my seat, $${SUB_PRICE}/mo`,
      blurb: 'One membership, every seat we hold for you all month. Cancel any time.',
      classPrice,
    }
  }
  const fee = classPrice != null ? Math.round(classPrice * FEE_RATE * 100) / 100 : null
  const pct = `${Math.round(FEE_RATE * 100)}%`
  return {
    variant: v,
    amount: fee,
    unit: '/seat',
    label: fee != null ? `$${fee.toFixed(2)}/seat` : `${pct} of the class`,
    button: fee != null ? `Hold my seat, $${fee.toFixed(2)}` : `Hold my seat, ${pct} of the class`,
    blurb: fee != null
      ? `${pct} of the $${classPrice} class, only when you book. Nothing monthly.`
      : `${pct} of what the class costs, only when you book. Nothing monthly. This venue does not publish a price yet.`,
    classPrice,
  }
}

export function holdLink(session) {
  const offer = offerFor(session)
  const label = `${session.title} at ${session.venue?.name || 'a venue'}`
  const when = session.date ? ` on ${session.date}` : ''
  if (HOLD_FORM_URL) {
    const u = new URL(HOLD_FORM_URL)
    u.searchParams.set('usp', 'pp_url')
    u.searchParams.set(FORM_FIELDS.session, `${label}${when}`)
    u.searchParams.set(FORM_FIELDS.price, `${offer.label} (${offer.variant})`)
    return u.toString()
  }
  const subject = encodeURIComponent(`Hold my seat: ${label}`)
  const body = encodeURIComponent(
    `I want a seat held for ${label}${when}, at ${offer.label}.\n\n`
    + `I understand this is a prototype and nothing is booked yet.\n\n`
    + `My name:\nBest email:\n`,
  )
  return `mailto:${HOLD_EMAIL}?subject=${subject}&body=${body}`
}

function sessionProps(session) {
  return {
    session_id: session?.id || null,
    hobby: session?.hobby || null,
    venue: session?.venue?.name || null,
    source: session?.source || null,
    class_price: typeof session?.price === 'number' ? session.price : null,
  }
}

// The card was rendered: the denominator for the hold rate.
export function recordHoldView(session) {
  const offer = offerFor(session)
  track('hold_view', { ...sessionProps(session), price_shown: offer.amount, price_label: offer.label })
}

// The button was tapped: the numerator, and the only paid-intent signal.
export function recordHold(session) {
  const offer = offerFor(session)
  const holds = getState().holds || []
  updateStore({ holds: [{ sessionId: session.id, variant: offer.variant, price: offer.amount, at: Date.now() }, ...holds] })
  track('hold_click', { ...sessionProps(session), price_shown: offer.amount, price_label: offer.label })
}

// Attribution. Every path out of this site used to be an untracked _blank, so
// a fill could not be counted and there was nothing to show a venue.
export function recordClickOut(placeId, sessionId, extra = {}) {
  if (!placeId) return
  const clicks = getState().clicks || []
  updateStore({ clicks: [{ placeId, sessionId: sessionId || null, at: Date.now() }, ...clicks].slice(0, 200) })
  track('book_click', { place_id: placeId, session_id: sessionId || null, ...extra })
}

export function recordWent(placeId, sessionId, booked) {
  if (!placeId) return
  const went = getState().went || []
  track('book_answer', { place_id: placeId, session_id: sessionId || null, booked: !!booked })
  if (went.some((w) => w.placeId === placeId && w.sessionId === (sessionId || null))) return
  updateStore({ went: [{ placeId, sessionId: sessionId || null, booked: !!booked, at: Date.now() }, ...went] })
}

export const clicksFor = (st, placeId) => (st.clicks || []).filter((c) => c.placeId === placeId).length
export const wentFor = (st, placeId) => (st.went || []).filter((c) => c.placeId === placeId && c.booked !== false).length

// A click out that has not been answered yet, so the page can ask "did you
// book?" when the visitor comes back. Only the most recent one, and only for
// the place being looked at.
export function pendingClick(st, placeId) {
  const c = (st.clicks || []).find((x) => x.placeId === placeId)
  if (!c) return null
  const answered = (st.went || []).some((w) => w.placeId === placeId && w.at > c.at)
  return answered ? null : c
}
