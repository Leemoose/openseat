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
      <p>Every prior attempt to list local hobby classes asked the shop to maintain a second listing. TakeLessons (Microsoft) shut down in 2024. CourseHorse skips Philadelphia after a decade. Dabble lists two Philly events today. A one-person pottery studio will not keep your calendar current, so the product has to read theirs. The three adapters that already work here (The Events Calendar REST API, Squarespace JSON, Acuity's public scheduler) cover a large share of small venues with zero effort from the venue.</p>

      <h2>What is real and what is not</h2>
      <ul>
        <li><Stamp source="feed" /> read from an organizer's own published calendar (First Friday dates, from the Old City District).</li>
        <li><Stamp source="snapshot" /> read from the venue's site or scheduler on 2026-09-24 and entered by hand (PRG's intro courses and prices, YAY!Clay's Clay Dates, Redcap's weekly events).</li>
        <li><Stamp source="sample" /> plausible for that venue but not verified. Replace as adapters come online.</li>
        <li>Venues are real, with real addresses. Seat counts, the people, and the open seats are invented. Used guitars are a live snapshot from Reverb's public API.</li>
        <li>Nothing you do here leaves your browser. There is no account and no server yet.</li>
      </ul>

      <h2>What we are testing</h2>
      <p>Two questions. Will people take an open seat next to a stranger at a real session, and will they come back the following week. And on the <Link to="/pricing">pricing page</Link>: what a person would pay for the member layer, and what a studio would pay for a seat that was going to sit empty.</p>
      <p className="small muted" style={{ marginTop: 24 }}>Built as a Wharton class project, Philadelphia, fall 2026.</p>
    </div>
  )
}
