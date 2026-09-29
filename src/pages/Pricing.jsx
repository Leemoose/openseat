import { Link } from 'react-router-dom'
import { useStore } from '../lib/store.js'
import { HOLD_FORM_URL, PROMISE } from '../lib/intent.js'
import { track, variant, SUB_PRICE, FEE_RATE } from '../lib/track.js'
import { toast } from '../App.jsx'

// The research this project ran said plainly that revenue will not come from
// the hobbyist: 13% of Americans spend $100+/month on a hobby, 53% learn from
// YouTube, and the social layer is given away free by Partiful, Luma and
// Heylo. This page used to ignore that and sell a $5 subscription whose
// bullets were those same free features.
//
// What it sells now is the one thing on the old list with a real cost behind
// it, and the one model in the research proven to be consumer-paid: a seat
// that is actually held for you at the weekly session. The free calendar is
// the acquisition channel for it, not the product.
//
// How that seat is priced is the experiment. A visitor is dealt one of two
// arms on first visit (lib/track.js) and this page shows the same arm the
// session pages do, so the site never quotes two prices to one person.
const PCT = `${Math.round(FEE_RATE * 100)}%`
const USER_POLL = ['$0, never', '$1-3 a booking', '$5 a booking', `$${SUB_PRICE} a month`, `$${SUB_PRICE * 2} a month`, 'Only if a friend came']
const SHOP_POLL = ['Nothing', '5% of the seat', '10% of the seat', '$49 / mo flat', '$99 / mo flat']

export default function Pricing() {
  const [st, update] = useStore()
  const wtp = st.wtp || {}
  const holds = (st.holds || []).length
  const v = variant()
  const pick = (k, val) => {
    update({ wtp: { ...wtp, [k]: val, at: Date.now() } })
    track('poll_answer', { poll: k, answer: val })
    toast('Noted. Thank you.')
  }

  return (
    <>
      <div className="reveal">
        <div className="tiny" style={{ color: 'var(--clay)' }}>Pricing, proposed</div>
        <h1 style={{ marginTop: 6 }}>The calendar is free.<br /><span className="em">You pay for a seat we hold.</span></h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: '54ch' }}>
          {PROMISE} Finding the Tuesday thing should not cost anything. Walking in
          without arranging it yourself is worth something, and that is the part we charge for.
        </p>
      </div>

      <div className="sec">
        <div className="sec-h"><h2>For people</h2></div>
        <div className="grid two">
          <div className="plan reveal">
            <div className="k">Everything you can see</div>
            <div className="amt">$0</div>
            <ul>
              <li>Every session at every venue, read from their own calendars</li>
              <li>What a first class costs, where anyone publishes it</li>
              <li>Open seats, both directions, and calendar files</li>
              <li>No account needed to use any of it</li>
            </ul>
          </div>
          {v === 'sub' ? (
            <div className="plan hot reveal" style={{ '--i': 1 }}>
              <div className="k">Held seats, all month</div>
              <div className="amt">${SUB_PRICE}<small>/month</small></div>
              <ul>
                <li>We reserve the wheel, the table, the bay, the belay slot</li>
                <li>As many seats as you want held, at any venue on the site</li>
                <li>Come alone and you are put with the others who did</li>
                <li>Cancel any time. Miss a seat and it moves to next week, once.</li>
              </ul>
            </div>
          ) : (
            <div className="plan hot reveal" style={{ '--i': 1 }}>
              <div className="k">A held seat</div>
              <div className="amt">{PCT}<small> of the class, per seat</small></div>
              <ul>
                <li>We reserve the wheel, the table, the bay, the belay slot</li>
                <li>A few dollars on top of the class price, only when you book</li>
                <li>Come alone and you are put with the others who did</li>
                <li>Nothing monthly. Miss it and the seat moves to next week, once.</li>
              </ul>
            </div>
          )}
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <b>What would you honestly pay for a seat held at a class you have never been to?</b>
          <div className="poll" style={{ marginTop: 10 }}>{USER_POLL.map((val) => <button key={val} className={`chip${wtp.user === val ? ' on' : ''}`} onClick={() => pick('user', val)}>{val}</button>)}</div>
          <p className="small muted" style={{ marginTop: 10 }}>
            A tap is a preference. The real test is the <Link to="/">Hold my seat</Link> button on any
            session page, which asks for an email.{holds > 0 && ` You have used it ${holds} ${holds === 1 ? 'time' : 'times'}.`}
          </p>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h"><h2>For studios, gyms and shops</h2></div>
        <div className="grid two">
          <div className="plan reveal">
            <div className="k">Listed</div>
            <div className="amt">$0</div>
            <ul>
              <li>Your public schedule, read automatically. You maintain nothing.</li>
              <li>Every session links to your own booking page</li>
              <li>See how many people found you here</li>
            </ul>
          </div>
          <div className="plan reveal" style={{ '--i': 1 }}>
            <div className="k">Filled seat</div>
            <div className="amt">10%<small> of the seat, only when it fills</small></div>
            <ul>
              <li>We fill the empty wheel, the empty belay slot, the empty table</li>
              <li>You see that the person was new to you</li>
              <li>No subscription, no ad budget, no discounting</li>
              <li>Or $49 / month flat for studios that prefer a fixed cost</li>
            </ul>
          </div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <b>If you run a studio or shop: what would you pay for a seat that was going to sit empty?</b>
          <div className="poll" style={{ marginTop: 10 }}>{SHOP_POLL.map((val) => <button key={val} className={`chip${wtp.shop === val ? ' on' : ''}`} onClick={() => pick('shop', val)}>{val}</button>)}</div>
          <p className="small muted" style={{ marginTop: 10 }}>
            Second, not first. A venue cannot be charged for a fill until a fill can be
            counted, and that only started being measured recently.
          </p>
        </div>
      </div>

      <div className="note" style={{ marginTop: 28 }}>
        Prototype: nothing is charged. We count taps, and the price you see is one of two
        we are testing.{' '}
        {HOLD_FORM_URL
          ? <a href={HOLD_FORM_URL} target="_blank" rel="noreferrer">The two-question form ↗</a>
          : <span>The Hold my seat button emails a real inbox.</span>}
        {' '}<Link to="/me">What we recorded about you</Link>.
      </div>
    </>
  )
}
