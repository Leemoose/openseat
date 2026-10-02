// Paid intent and attribution, in one file so there is exactly one place to
// change the offer, the form and the promise.
//
// Why this exists: the product's whole revenue question is "would anyone pay",
// and until now it could not answer it. The pricing poll wrote to localStorage
// and nothing else, so no answer had ever left a browser. Everything here is
// built so that one constant turns a prototype gesture into a real signal,
// with no backend.
import { getState, updateStore } from './store.js'
import { track, variant, SUB_PRICE, FEE_RATE, MIN_FEE } from './track.js'

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
export const PROMISE = 'Every beginner class in Philadelphia, in one place.'

// The price a visitor is shown, which depends on the arm they were dealt.
// Either way the class itself still has to be paid for; the arms differ only
// in how Kindling earns.
//
//   sub  A $10/month membership is the paywall: subscribe to book seats on
//        Kindling, then pay each class's own price to the venue.
//   fee  No membership. Holding a seat costs the class price plus a booking
//        fee of 5% of it, never under $5 per class. Kindling keeps the fee and
//        the class price goes to the venue. When the venue publishes no price,
//        only the fee is charged here and the class is paid at the venue.
//
// A multi-week course is priced per class: the venue's course price divided
// by its meetings, with the fee worked out on each class. The whole run is a
// commitment, so its total is shown alongside in smaller type.
//
// `short` is what a card shows; `lines` is the breakdown on the class page.
export const dollars = (n) => `$${n % 1 ? n.toFixed(2) : n}`
const cents = (n) => Math.round(n * 100) / 100

export function offerFor(session) {
  const v = variant()
  const coursePrice = typeof session?.price === 'number' ? session.price : null
  const meetings = coursePrice && session?.meetings > 1 ? session.meetings : null
  const classPrice = coursePrice != null && meetings ? cents(coursePrice / meetings) : coursePrice
  const per = meetings ? '/class' : ''
  const venue = session?.venue?.name || 'the venue'
  const venuePrice = classPrice == null ? 'Set by venue' : classPrice === 0 ? 'Free' : `${dollars(classPrice)}${per}`
  if (v === 'sub') {
    return {
      variant: v,
      amount: SUB_PRICE,
      unit: '/month',
      label: `$${SUB_PRICE}/month membership`,
      short: classPrice == null ? 'Price set by venue' : classPrice === 0 ? 'Free' : `${dollars(classPrice)}${per}`,
      commitment: meetings ? `${meetings} classes · ${dollars(coursePrice)} total` : null,
      heading: 'Members book seats on Kindling',
      button: `Subscribe for $${SUB_PRICE}/mo`,
      blurb: 'One membership lets you book a seat at any class on Kindling, as many as you like. Cancel any time.',
      lines: [
        ['Kindling membership', `$${SUB_PRICE}/month`],
        [`Class, paid to ${venue}`, venuePrice],
      ],
      note: [
        meetings && `This is a ${meetings}-class course: booking commits you to all ${meetings} classes, ${dollars(coursePrice)} in total.`,
        classPrice === 0
          ? 'This class is free; the membership is what lets you book it.'
          : 'The membership does not cover the class. You still pay the class price to the venue.',
      ].filter(Boolean).join(' '),
      classPrice,
      meetings,
    }
  }
  const fee = classPrice ? Math.max(MIN_FEE, cents(classPrice * FEE_RATE)) : MIN_FEE
  const each = classPrice != null ? cents(classPrice + fee) : null
  const total = meetings ? cents(coursePrice + fee * meetings) : null
  return {
    variant: v,
    fee,
    amount: each ?? fee,
    unit: meetings ? '/class' : '/seat',
    label: each != null ? `${dollars(each)}${meetings ? '/class' : '/seat'}` : `${dollars(fee)} fee + class`,
    short: each != null ? `${dollars(each)}${per}` : `${dollars(fee)} + class`,
    commitment: meetings ? `${meetings} classes · ${dollars(total)} total` : null,
    heading: 'Want us to hold a seat?',
    button: `Hold my seat, ${dollars(each ?? fee)}${per}`,
    blurb: meetings ? 'Pay per class, only when you book. Nothing monthly.' : 'Pay once, only when you book. Nothing monthly.',
    lines: [
      [`Class at ${venue}`, classPrice == null ? 'Paid at venue' : venuePrice],
      ['Kindling booking fee', `${dollars(fee)}${per}`],
    ],
    note: [
      meetings && `This is a ${meetings}-class course: booking commits you to all ${meetings} classes, ${dollars(total)} in total (${dollars(coursePrice)} to ${venue}, ${dollars(cents(fee * meetings))} in Kindling fees).`,
      each != null
        ? `The class price goes to ${venue}; the booking fee is ours.`
        : `${venue} has not published a price, so you pay the class there. Here you pay only the booking fee.`,
    ].filter(Boolean).join(' '),
    classPrice,
    meetings,
    total,
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
  track('hold_view', { ...sessionProps(session), price_shown: offer.amount, price_label: offer.label, fee: offer.fee ?? null, meetings: offer.meetings, total: offer.total ?? null })
}

// The button was tapped: the numerator, and the only paid-intent signal.
export function recordHold(session) {
  const offer = offerFor(session)
  const holds = getState().holds || []
  updateStore({ holds: [{ sessionId: session.id, variant: offer.variant, price: offer.amount, at: Date.now() }, ...holds] })
  track('hold_click', { ...sessionProps(session), price_shown: offer.amount, price_label: offer.label, fee: offer.fee ?? null, meetings: offer.meetings, total: offer.total ?? null })
}

// Attribution. Every path out of this site used to be an untracked _blank, so
// a fill could not be counted and there was nothing to show a venue.
export function recordClickOut(placeId, sessionId, extra = {}) {
  if (!placeId) return
  const clicks = getState().clicks || []
  updateStore({ clicks: [{ placeId, sessionId: sessionId || null, at: Date.now() }, ...clicks].slice(0, 200) })
  track('book_click', { place_id: placeId, session_id: sessionId || null, ...extra })
}
