import { Link, useSearchParams } from 'react-router-dom'
import { HOBBIES } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { HOODS, milesBetween } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { dayKey, fmtDayLong, fmtRel } from '../lib/format.js'
import { SessionCard, friendsAt } from '../components/bits.jsx'

// The time-first entry point: "I am free Thursday, what is on?" Explore answers
// "I want to try pottery"; this answers the other half, across every hobby.
// "Tonight" reads well but the list includes a 10am class that has not finished
// yet, so the honest label is "Today".
const WHEN = [
  ['week', 'Next 7 days'],
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
  ['weekend', 'This weekend'],
]

export default function Week() {
  const [st, update] = useStore()
  const [sp, setSp] = useSearchParams()

  const setQ = (patch) => setSp((prev) => {
    const n = new URLSearchParams(prev)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || v === false) n.delete(k); else n.set(k, String(v))
    }
    return n
  }, { replace: true })

  const when = sp.get('when') || 'week'
  const hobby = sp.get('hobby') || 'all'
  const nearId = sp.get('near') || st.me.hood
  const radius = +(sp.get('r') || 5)
  const beginner = sp.get('beg') === '1'
  const freeOnly = sp.get('free') === '1'
  const here = HOODS.find((h) => h.id === nearId) || HOODS[0]

  const now = new Date()
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0)
  const dayOffset = (d) => Math.round((new Date(d).setHours(0, 0, 0, 0) - midnight) / 86400000)

  function inWindow(s) {
    const off = dayOffset(s.start)
    if (when === 'today') return off === 0
    if (when === 'tomorrow') return off === 1
    if (when === 'weekend') {
      // The coming Sat/Sun, including today if today is already the weekend.
      const dow = s.start.getDay()
      return off >= 0 && off <= 7 && (dow === 6 || dow === 0)
    }
    return off >= 0 && off < 7
  }

  const list = SESSIONS
    .filter(inWindow)
    .filter((s) => hobby === 'all' || s.hobby === hobby)
    .filter((s) => !beginner || s.level === 'First time welcome')
    .filter((s) => !freeOnly || s.price === 0)
    .map((s) => ({ s, miles: milesBetween(here, s.venue) }))
    .filter(({ miles }) => miles == null || miles <= radius)

  const byDay = []
  const seen = new Map()
  for (const x of list) {
    const k = dayKey(x.s.start)
    if (!seen.has(k)) { seen.set(k, []); byDay.push(seen.get(k)) }
    seen.get(k).push(x)
  }

  const counts = Object.fromEntries(HOBBIES.map((h) => [h.id, list.filter((x) => x.s.hobby === h.id).length]))
  const hobbiesWithAny = HOBBIES.filter((h) => counts[h.id] > 0 || h.id === hobby)

  return (
    <>
      <div className="reveal">
        <div className="kicker tiny" style={{ color: 'var(--clay)' }}>Philadelphia</div>
        <h1 style={{ marginTop: 6 }}>What's on</h1>
        <p className="muted" style={{ marginTop: 10, maxWidth: '52ch' }}>
          Every hobby, in one list, by day. For when the free evening comes first and the hobby second.
        </p>
      </div>

      <div className="filtbar" style={{ marginTop: 18 }}>
        <div className="chips scroll">
          {WHEN.map(([k, l]) => <button key={k} className={`chip${when === k ? ' on' : ''}`} onClick={() => setQ({ when: k === 'week' ? null : k })}>{l}</button>)}
        </div>
        <label className="field">Near
          <select value={nearId} onChange={(e) => { setQ({ near: e.target.value }); update({ me: { ...st.me, hood: e.target.value } }) }}>
            {HOODS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <label className="field">Within <b className="mono">{radius} mi</b>
          <input type="range" min="1" max="30" value={radius} onChange={(e) => setQ({ r: e.target.value === '5' ? null : e.target.value })} />
        </label>
        <button className={`chip${beginner ? ' on' : ''}`} onClick={() => setQ({ beg: !beginner && '1' })}>First time welcome</button>
        <button className={`chip${freeOnly ? ' on' : ''}`} onClick={() => setQ({ free: !freeOnly && '1' })}>Free</button>
      </div>

      <div className="chips scroll" style={{ marginTop: 10 }}>
        <button className={`chip${hobby === 'all' ? ' on' : ''}`} onClick={() => setQ({ hobby: null })}>All hobbies</button>
        {hobbiesWithAny.map((h) => (
          <button key={h.id} className={`chip${hobby === h.id ? ' on' : ''}`} onClick={() => setQ({ hobby: h.id })}>{h.name} · {counts[h.id]}</button>
        ))}
      </div>

      {byDay.length === 0
        ? <div className="empty" style={{ marginTop: 24 }}>
          Nothing in that window within {radius} miles. Try a wider radius, or <button className="lnk" onClick={() => setQ({ when: null, beg: null, free: null, hobby: null })}>the next 7 days</button>.
        </div>
        : byDay.map((day, di) => (
          <div key={di}>
            <div className="day-h">{fmtRel(day[0].s.start)} <small>{fmtDayLong(day[0].s.start)} · {day.length}</small></div>
            <div className="grid two">
              {day.map(({ s, miles }, i) => <SessionCard key={s.id} s={s} miles={miles} i={i} friends={friendsAt(s, st.following, SEED_OPEN_SEATS)} going={st.going.includes(s.id)} />)}
            </div>
          </div>
        ))}

      <div className="note" style={{ marginTop: 32 }}>
        Looking further out, or want to see what repeats rather than what is on one day? <Link to="/">Pick a hobby</Link> and open its Classes view.
      </div>
    </>
  )
}
