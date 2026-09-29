// Click tracking and the pricing experiment, in one file, with no SDK.
//
// Why no SDK: the site is static JSON on GitHub Pages with no backend, and the
// one earlier attempt at measuring willingness to pay wrote to localStorage
// and nothing else, so no answer ever left a browser. This module sends every
// event to a hosted collector over a plain POST, which is all an analytics
// SDK does underneath, minus 60KB and a cookie banner.
//
// The collector is PostHog's capture endpoint. Its free tier takes a million
// events a month, it needs one project key and nothing else, and its UI can
// split any count by the `variant` property, which is the whole analysis.
// Until ANALYTICS_KEY is set, events are kept in a local ring buffer only and
// the test collects nothing from anyone but you. That is the old failure, so
// the key is the one thing that has to land before the Reddit post goes up.

// Project 636192 on PostHog US cloud. This is the write-only project key, which
// is meant to ship in a public page; it cannot read anything back.
export const ANALYTICS_KEY = 'phc_mTJCAQdj5tjT5cxPcmVMJ7qemppm4roW8LCgZVUyZWA5'
export const ANALYTICS_HOST = 'https://us.i.posthog.com'

// The experiment. One visitor sees one price model for as long as their
// browser remembers them; it is chosen at random on first visit and never
// re-rolled, including by "Reset demo", because a visitor who re-rolls
// contaminates both arms.
//
//   sub  a $10/month membership, hold as many seats as you like
//   fee  a per-booking fee of 5% of what the class costs, nothing monthly
//
// The two numbers below are the levers. Everything on the site that shows a
// price reads them from here.
export const VARIANTS = ['sub', 'fee']
export const SUB_PRICE = 10        // dollars per month
export const FEE_RATE = 0.05       // share of the class price, per booking

// A visitor id and their arm live under their own key, outside the demo state
// that "Reset demo" wipes.
const KEY = 'openseat.track.v1'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)) } catch { /* private mode */ }
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Query params can sit before the hash (?src=reddit#/) or inside it
// (#/pricing?v=fee), depending on who typed the link. Read both.
function params() {
  const out = new URLSearchParams(location.search)
  const i = location.hash.indexOf('?')
  if (i >= 0) new URLSearchParams(location.hash.slice(i + 1)).forEach((v, k) => out.set(k, v))
  return out
}

let me = null
export function identity() {
  if (me) return me
  const t = read()
  const q = params()
  let changed = false
  if (!t.id) { t.id = uuid(); t.firstSeen = Date.now(); changed = true }
  // ?v=sub or ?v=fee forces an arm, for screenshots and for checking both
  // render. It is sticky once used so the forced arm stays consistent.
  const forced = q.get('v')
  if (forced && VARIANTS.includes(forced) && t.variant !== forced) { t.variant = forced; t.forced = true; changed = true }
  if (!t.variant) { t.variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)]; changed = true }
  // Where they came from, kept from the first landing so every later event
  // can be split by source. Post ?src=reddit and ?src=wharton links.
  const src = q.get('src')
  if (src && !t.src) { t.src = src.slice(0, 40); changed = true }
  if (!t.referrer && document.referrer) { t.referrer = document.referrer.slice(0, 200); changed = true }
  t.visits = (t.visits || 0)
  if (changed) write(t)
  me = t
  return me
}

// Count a session (a visit) once per page load.
let visitCounted = false
function countVisit() {
  if (visitCounted) return
  visitCounted = true
  const t = identity()
  t.visits = (t.visits || 0) + 1
  t.lastSeen = Date.now()
  write(t)
}

export const variant = () => identity().variant

// The last events this browser sent, so the profile page can show the visitor
// what was recorded about them. Honesty is the product's argument.
const RING = 'openseat.events.v1'
export function recentEvents() {
  try { return JSON.parse(localStorage.getItem(RING) || '[]') } catch { return [] }
}
function remember(ev) {
  try { localStorage.setItem(RING, JSON.stringify([ev, ...recentEvents()].slice(0, 100))) } catch { /* ignore */ }
}

function send(payload) {
  if (!ANALYTICS_KEY) {
    if (import.meta.env?.DEV) console.debug('[track]', payload.event, payload.properties)
    return
  }
  const body = JSON.stringify({ api_key: ANALYTICS_KEY, ...payload })
  // keepalive so a click that navigates away still gets delivered, text/plain
  // so there is no CORS preflight to lose it to. PostHog reads both.
  try {
    fetch(`${ANALYTICS_HOST}/capture/`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body }).catch(() => {})
  } catch { /* offline */ }
}

// The one call every click handler makes.
export function track(event, props = {}) {
  countVisit()
  const t = identity()
  const ev = {
    event,
    distinct_id: t.id,
    timestamp: new Date().toISOString(),
    properties: {
      variant: t.variant,
      forced: !!t.forced,
      src: t.src || null,
      $referrer: t.referrer || null,
      visits: t.visits,
      path: location.hash.replace(/^#/, '') || '/',
      $current_url: location.href,
      ...props,
    },
  }
  remember({ event, at: ev.timestamp, ...props })
  send(ev)
}

export function pageview(path) {
  track('$pageview', { path })
}
