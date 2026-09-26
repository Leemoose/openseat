import { Link } from 'react-router-dom'
import { HOBBIES } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { HOODS, milesBetween } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { hobbyStats } from '../lib/series.js'
import { SessionCard, friendsAt } from '../components/bits.jsx'
import OpenSeatCard from '../components/OpenSeatCard.jsx'
import SearchBox from '../components/SearchBox.jsx'
import { toast } from '../App.jsx'

export default function Home() {
  const [st, update] = useStore()
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  const stats = Object.fromEntries(HOBBIES.map((h) => [h.id, hobbyStats(h.id)]))

  // "Soon" is the hook that turns a browse into a plan: the next few things
  // that are actually happening, filtered to what this visitor said they like.
  const mine = SESSIONS.filter((s) => st.me.hobbies.includes(s.hobby))
  const soon = (mine.length ? mine : SESSIONS).slice(0, 4)
  const allOpen = [...st.myOpenSeats, ...SEED_OPEN_SEATS.filter((o) => !st.hidden.includes(o.id))]

  const tile = (h, minor) => {
    const s = stats[h.id]
    const cost = s.free ? 'Some free' : s.from != null ? `From $${s.from}` : null
    return (
      <Link key={h.id} to={`/h/${h.id}`} className={`tile${minor ? ' minor' : ''} reveal`} style={{ '--tint': h.tint }}>
        {cost && <span className="n">{cost}</span>}
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
        <h1>Find the <span className="em">Tuesday thing.</span></h1>
        <p className="lead">The classes that repeat every week at real Philly studios, gyms and shops, read from their own calendars. Pick something to try, or just see what is on today.</p>
        <div className="herosearch"><SearchBox placeholder="Try pottery, Fishtown, YAY!Clay" /></div>
        <div className="row" style={{ marginTop: 14 }}>
          <Link to="/week" className="btn primary">What's on this week</Link>
          <Link to="/open" className="btn">Open seats</Link>
          <Link to="/about" className="btn ghost">How this works</Link>
        </div>
      </section>

      <section className="sec">
        <div className="sec-h"><h2>Pick something to try</h2><span className="muted small">What it costs to walk in once</span></div>
        <div className="tiles">{HOBBIES.filter((h) => h.primary).map((h) => tile(h, false))}</div>
        <div className="tiles" style={{ marginTop: 12 }}>{HOBBIES.filter((h) => !h.primary).map((h) => tile(h, true))}</div>
      </section>

      <section className="sec">
        <div className="sec-h">
          <h2>Coming up near you</h2>
          <span className="small muted">
            {st.me.hobbies.length ? st.me.hobbies.map((id) => HOBBIES.find((h) => h.id === id)?.name.toLowerCase()).join(' and ') : 'Everything'} near {here.name}. <Link to="/me">Change</Link> · <Link to="/week">See all</Link>
          </span>
        </div>
        <div className="grid two">
          {soon.map((s, i) => <SessionCard key={s.id} s={s} i={i} miles={milesBetween(here, s.venue)} friends={friendsAt(s, st.following, SEED_OPEN_SEATS)} going={st.going.includes(s.id)} />)}
        </div>
      </section>

      <section className="sec">
        <div className="sec-h"><h2>Go with someone</h2><Link to="/open">All open seats</Link></div>
        <div className="grid three">
          {allOpen.slice(0, 3).map((o, i) => (
            <OpenSeatCard key={o.id} o={o} i={i} me={st.me} requested={st.requested.includes(o.id)}
              onRequest={(id) => { update({ requested: st.requested.includes(id) ? st.requested.filter((x) => x !== id) : [...st.requested, id] }); toast(st.requested.includes(id) ? 'Request withdrawn' : 'Asked. They get a note with your profile.') }}
              onRemove={(id) => update({ myOpenSeats: st.myOpenSeats.filter((x) => x.id !== id) })} />
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="sec-h"><h2>Why this is different</h2></div>
        <div className="grid three steps">
          <div className="card"><h3>Shops maintain nothing</h3><p className="small muted" style={{ marginTop: 6 }}>Sessions are read from the calendars venues already publish. No second listing to keep current, which is where every hobby marketplace before this one died.</p></div>
          <div className="card"><h3>Recurring beats one-off</h3><p className="small muted" style={{ marginTop: 6 }}>The thing people stick with is the Tuesday thing. We surface what repeats, so you can come back next week without searching again.</p></div>
          <div className="card"><h3>Seats, not strangers</h3><p className="small muted" style={{ marginTop: 6 }}>An open seat is a real session with a real person already going. You show up to something, not to a group chat.</p></div>
        </div>
      </section>
    </>
  )
}
