import { Link } from 'react-router-dom'
import { HOBBIES } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { HOODS, milesBetween } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { hobbyStats } from '../lib/series.js'
import { PROMISE } from '../lib/intent.js'
import { SessionCard } from '../components/bits.jsx'
import SearchBox from '../components/SearchBox.jsx'

export default function Home() {
  const [st] = useStore()
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  const stats = Object.fromEntries(HOBBIES.map((h) => [h.id, hobbyStats(h.id)]))

  // The fastest way to the hold button: a few beginner-friendly sessions that
  // are actually coming up, one click from the session page.
  const soon = SESSIONS.filter((s) => s.level === 'First time welcome').slice(0, 4)

  // Order by how much real data a hobby has behind it, not by the order the
  // list happens to be written in. A hobby with fed sessions earns the first
  // tile; one held up by plausible guesses sorts last within its row.
  const ranked = (list) => [...list].sort((a, b) => {
    const A = stats[a.id]; const B = stats[b.id]
    return (B.fed - A.fed) || (B.real - A.real) || (B.places - A.places)
  })

  const tile = (h, minor) => {
    const s = stats[h.id]
    return (
      <Link key={h.id} to={`/h/${h.id}`} className={`tile${minor ? ' minor' : ''} reveal`} style={{ '--tint': h.tint }}>
        <span className="g">{h.glyph}</span>
        <span>
          <h3>{h.name}</h3>
          <p>{h.blurb}</p>
          <p className="stat">{s.places} {s.places === 1 ? 'place' : 'places'}{s.beginner > 0 && <> · {s.beginner} for beginners</>}</p>
        </span>
      </Link>
    )
  }

  return (
    <>
      <section className="hero reveal">
        <div className="kicker">Philadelphia · this month</div>
        <h1>Try the <span className="em">Tuesday thing.</span></h1>
        <p className="lead">{PROMISE} Pick a beginner class at a real Philly studio, gym or shop, and we hold a seat for you.</p>
        <div className="herosearch"><SearchBox placeholder="Try pottery, climbing, YAY!Clay" /></div>
        <div className="row" style={{ marginTop: 14 }}>
          <a href="#pick" className="btn primary" onClick={(e) => { e.preventDefault(); document.getElementById('pick')?.scrollIntoView({ behavior: 'smooth' }) }}>Find a class</a>
          <Link to="/about" className="btn ghost">How it works</Link>
        </div>
      </section>

      <section className="sec" id="pick">
        <div className="sec-h"><h2>Pick something to try</h2></div>
        <div className="tiles">{ranked(HOBBIES.filter((h) => h.primary)).map((h) => tile(h, false))}</div>
        <div className="tiles" style={{ marginTop: 12 }}>{ranked(HOBBIES.filter((h) => !h.primary)).map((h) => tile(h, true))}</div>
      </section>

      {soon.length > 0 && (
        <section className="sec">
          <div className="sec-h"><h2>Good first classes, coming up</h2><span className="small muted">No experience needed</span></div>
          <div className="grid two">
            {soon.map((s, i) => <SessionCard key={s.id} s={s} i={i} miles={milesBetween(here, s.venue)} />)}
          </div>
        </section>
      )}

      <section className="sec">
        <div className="sec-h"><h2>How it works</h2></div>
        <div className="grid three steps">
          <div className="card"><h3>1. Pick a class</h3><p className="small muted" style={{ marginTop: 6 }}>Real weekly sessions at Philly studios, gyms and shops.</p></div>
          <div className="card"><h3>2. Tap Hold my seat</h3><p className="small muted" style={{ marginTop: 6 }}>Tell us who you are. No account, no booking system to figure out.</p></div>
          <div className="card"><h3>3. Just show up</h3><p className="small muted" style={{ marginTop: 6 }}>We confirm by email that your seat is held. Come alone or bring someone.</p></div>
        </div>
      </section>
    </>
  )
}
