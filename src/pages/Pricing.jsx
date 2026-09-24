import { useStore } from '../lib/store.js'
import { toast } from '../App.jsx'

// Drop a Google Form / Tally link here to capture answers for real. Empty hides the link.
const FEEDBACK_URL = ''

const USER_POLL = ['$0, never', '$3 / mo', '$5 / mo', '$8 / mo', '$12 / mo']
const SHOP_POLL = ['Nothing', '5% of the seat', '10% of the seat', '$49 / mo flat', '$99 / mo flat']

export default function Pricing() {
  const [st, update] = useStore()
  const wtp = st.wtp || {}
  const pick = (k, v) => { update({ wtp: { ...wtp, [k]: v, at: Date.now() } }); toast('Noted. Thank you.') }

  return (
    <>
      <div className="reveal">
        <div className="tiny" style={{ color: 'var(--clay)' }}>Pricing, proposed</div>
        <h1 style={{ marginTop: 6 }}>Free to show up.<br /><span className="em">Shops pay when a seat fills.</span></h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: '52ch' }}>These are the numbers we are testing. Pick the one you would actually pay, not the one that sounds nice.</p>
      </div>

      <div className="sec">
        <div className="sec-h"><h2>For people</h2></div>
        <div className="grid two">
          <div className="plan reveal">
            <div className="k">Free</div>
            <div className="amt">$0</div>
            <ul>
              <li>Every session near you, every hobby</li>
              <li>Take up to 2 open seats a month</li>
              <li>Calendar files and invites</li>
            </ul>
          </div>
          <div className="plan hot reveal" style={{ '--i': 1 }}>
            <div className="k">Member</div>
            <div className="amt">$5<small>/month</small></div>
            <ul>
              <li>Unlimited open seats, both directions</li>
              <li>See what people you follow are doing this week</li>
              <li>A reminder the morning of, and one after: “going again next week?”</li>
              <li>Member nights: a held table at one venue per hobby per month</li>
            </ul>
          </div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <b>What would you honestly pay per month for Member?</b>
          <div className="poll" style={{ marginTop: 10 }}>{USER_POLL.map((v) => <button key={v} className={`chip${wtp.user === v ? ' on' : ''}`} onClick={() => pick('user', v)}>{v}</button>)}</div>
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
          <div className="plan hot reveal" style={{ '--i': 1 }}>
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
        </div>
      </div>

      <div className="note" style={{ marginTop: 28 }}>
        Prototype: your answer is saved in this browser only, so tell us what you picked.{' '}
        {FEEDBACK_URL ? <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">Two-question form ↗</a> : <span>A two-question form will go here.</span>}
      </div>
    </>
  )
}
