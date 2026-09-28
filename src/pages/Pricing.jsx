import { Link } from 'react-router-dom'
import { useStore } from '../lib/store.js'
import { HOLD_PRICE, HOLD_FORM_URL, PROMISE } from '../lib/intent.js'
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
const USER_POLL = ['$0, never', `$${HOLD_PRICE - 15} a seat`, `$${HOLD_PRICE} a seat`, `$${HOLD_PRICE + 15} a seat`, 'Only if a friend came']
const SHOP_POLL = ['Nothing', '5% of the seat', '10% of the seat', '$49 / mo flat', '$99 / mo flat']

export default function Pricing() {
  const [st, update] = useStore()
  const wtp = st.wtp || {}
  const holds = (st.holds || []).length
  const pick = (k, v) => { update({ wtp: { ...wtp, [k]: v, at: Date.now() } }); toast('Noted. Thank you.') }

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
          <div className="plan hot reveal" style={{ '--i': 1 }}>
            <div className="k">A held seat</div>
            <div className="amt">${HOLD_PRICE}<small>/seat</small></div>
            <ul>
              <li>We reserve the wheel, the table, the bay, the belay slot</li>
              <li>You get told it is yours. Nothing to book, nobody to call.</li>
              <li>Come alone and you are put with the others who did</li>
              <li>Miss it and the seat moves to next week, once</li>
            </ul>
          </div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <b>What would you honestly pay for a seat held at a class you have never been to?</b>
          <div className="poll" style={{ marginTop: 10 }}>{USER_POLL.map((v) => <button key={v} className={`chip${wtp.user === v ? ' on' : ''}`} onClick={() => pick('user', v)}>{v}</button>)}</div>
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
          <div className="poll" style={{ marginTop: 10 }}>{SHOP_POLL.map((v) => <button key={v} className={`chip${wtp.shop === v ? ' on' : ''}`} onClick={() => pick('shop', v)}>{v}</button>)}</div>
          <p className="small muted" style={{ marginTop: 10 }}>
            Second, not first. A venue cannot be charged for a fill until a fill can be
            counted, and that only started being measured recently.
          </p>
        </div>
      </div>

      <div className="note" style={{ marginTop: 28 }}>
        Prototype: these taps are saved in this browser only.{' '}
        {HOLD_FORM_URL
          ? <a href={HOLD_FORM_URL} target="_blank" rel="noreferrer">The two-question form ↗</a>
          : <span>The Hold my seat button emails a real inbox, which is the one signal here that leaves your machine.</span>}
      </div>
    </>
  )
}
