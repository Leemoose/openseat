import { Link } from 'react-router-dom'
import { Stamp } from '../components/bits.jsx'

export default function About() {
  return (
    <div className="prose reveal">
      <div className="tiny" style={{ color: 'var(--clay)' }}>About this prototype</div>
      <h1 style={{ marginTop: 6 }}>The hobby industry is fragmented. The Tuesday thing is not.</h1>
      <p style={{ marginTop: 16 }}>Every hobby in Philadelphia already has a weekly thing: the intro top-rope course at the climbing gym, the open board game night, the clay date on a Friday, the beginner guitar group. They live on thirty different websites, in Instagram stories, on a chalkboard by the register. Nobody can see them in one place, so most people never start, and the studio runs the session with three empty seats.</p>
      <p>OpenSeat reads those schedules from the calendars venues already publish, shows you what repeats near you, and lets someone who is already going hold a seat for someone who is not yet.</p>

      <h2>Why not just another marketplace</h2>
      <p>Every prior attempt to list local hobby classes asked the shop to maintain a second listing. TakeLessons (Microsoft) shut down in 2024. CourseHorse skips Philadelphia after a decade. Dabble lists two Philly events today. A one-person pottery studio will not keep your calendar current, so the product has to read theirs.</p>
      <p>That part is not a diagram. <code>scripts/build_feed.py</code> reads The Events Calendar REST API, the events plugin a large share of small venues already run on WordPress, and it is where the climbing sessions and Fleisher's workshops on this site come from. Nobody at either venue did anything. Three things that only showed up once it ran against real calendars: a venue's calendar carries closures, fundraisers and children's camps that are not sessions and have to be filtered out; a multidisciplinary art school needs each event routed to a hobby on its own, not the whole feed assigned to one; and capacity is almost never published, so the honest card says "seats not published" rather than inventing a number.</p>
      <p>It is deliberately slow and it caches. Hitting one venue's endpoint too hard during research got this network blocked from that site for two days, which is its own lesson about what a polite adapter has to look like. If a fetch fails the last good payload is kept and marked stale, because an adapter that empties its own listings on a bad night is worse than no adapter.</p>

      <h2>What is real and what is not</h2>
      <ul>
        <li><Stamp source="feed" /> pulled from the venue's own calendar by the adapter, with nothing typed by hand: every Philadelphia Rock Gym session, Fleisher's workshops, and First Friday dates from the Old City District.</li>
        <li><Stamp source="snapshot" /> read from the venue's site or scheduler on 2026-09-24 and entered by hand (YAY!Clay's Clay Dates, Redcap's weekly events, the golf leagues). These are the ones an adapter should eventually take over.</li>
        <li><Stamp source="sample" /> plausible for that venue but not verified. Replace as adapters come online.</li>
        <li>Two hobbies are researched to full depth against the venues' own sites: golf, 40 places with rates, hours and named instructors, and pottery, 34 places with 139 named instructors.</li>
        <li>Venues are real, with real addresses. Used guitars are a live snapshot from Reverb's public API.</li>
        <li><b>No seat count on this site is invented.</b> Where a venue's own scheduler publishes a class size, the card says how big the room is. Everywhere else it says "seats not published", which is most places. It never says how full a class already is, because no calendar, feed or booking page we read exposes that: a "2 seats left" here would be fiction, and that is the one number that would make the site feel urgent.</li>
        <li>The six people you can follow are demo people, marked wherever they appear. The open seats attached to them are invented too. The social layer is real product, the cast is not yet.</li>
        <li>Nothing you do here leaves your browser. There is no account and no server yet.</li>
      </ul>

      <h2>What we are testing</h2>
      <p>Will people take an open seat next to a stranger at a real session, and will they come back the following week.</p>
      <p>Then the money question, which the research says is the hard one: 13% of Americans spend $100 a month on a hobby, and the social layer is given away free by Partiful, Luma and Heylo, so a subscription to a calendar is not a business. What might be is a seat we actually hold for you, which is the one model in the research proven to be paid for by the person attending. Every session page has a <b>Hold my seat</b> button and we count who taps it. The <Link to="/pricing">pricing page</Link> carries the studio-side question, which comes second: a venue cannot be charged for filling a seat until a fill can be counted, and that only just started being measured.</p>
      <p className="small muted" style={{ marginTop: 24 }}>Built as a Wharton class project, Philadelphia, fall 2026.</p>
    </div>
  )
}
