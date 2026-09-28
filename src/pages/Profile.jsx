import { Link } from 'react-router-dom'
import { HOBBIES, hobbyById } from '../data/hobbies.js'
import { PEOPLE } from '../data/people.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { sessionById } from '../data/sessions.js'
import { HOODS } from '../lib/geo.js'
import { useStore, toggleIn } from '../lib/store.js'
import { downloadIcs } from '../lib/ics.js'
import { fmtRel, fmtTime } from '../lib/format.js'
import { Avatar } from '../components/bits.jsx'
import { toast } from '../App.jsx'

export default function Profile() {
  const [st, update, reset] = useStore()
  const me = st.me
  const plan = st.going.map(sessionById).filter(Boolean).sort((a, b) => a.start - b.start)
  const friendPlans = PEOPLE.filter((p) => st.following.includes(p.id)).map((p) => ({
    p, sessions: SEED_OPEN_SEATS.filter((o) => o.personId === p.id).map((o) => sessionById(o.sessionId)).filter(Boolean),
  }))

  return (
    <>
      <div className="grid two" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="card reveal">
            <div className="row" style={{ marginBottom: 14 }}>
              <Avatar person={{ name: me.name || 'You', tint: 'var(--ink)' }} lg />
              <div><h2>{me.name || 'You'}</h2><div className="small muted">{HOODS.find((h) => h.id === me.hood)?.name} · {me.hobbies.map((id) => hobbyById(id)?.name).join(', ') || 'no hobbies picked'}</div></div>
            </div>
            <div className="form">
              <label>Name people see</label>
              <input type="text" value={me.name} onChange={(e) => update({ me: { ...me, name: e.target.value } })} />
              <label>Neighborhood</label>
              <select value={me.hood} onChange={(e) => update({ me: { ...me, hood: e.target.value } })}>{HOODS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
              <label>Your hobbies</label>
              <div className="chips">{HOBBIES.map((h) => <button key={h.id} className={`chip${me.hobbies.includes(h.id) ? ' on' : ''}`} onClick={() => update({ me: { ...me, hobbies: toggleIn(me.hobbies, h.id) } })}>{h.name}</button>)}</div>
              <label>The line people see when you open a seat</label>
              <textarea value={me.blurb} maxLength={160} onChange={(e) => update({ me: { ...me, blurb: e.target.value } })} />
            </div>
          </div>

          <div className="card reveal" style={{ '--i': 1 }}>
            <h3>People you follow</h3>
            <p className="small muted" style={{ margin: '4px 0 12px' }}>Their sessions show up with their face on it. These six are demo people, marked as such wherever they appear, until there are real ones to follow.</p>
            <div className="stack" style={{ gap: 10 }}>
              {PEOPLE.map((p) => (
                <div key={p.id} className="between">
                  <div className="row"><Avatar person={p} /><div><b>{p.name}</b><div className="small muted">{p.hood} · {p.hobbies.map((id) => hobbyById(id)?.name).join(', ')}</div></div></div>
                  <button className={`btn sm ${st.following.includes(p.id) ? 'on' : 'ghost'}`} onClick={() => update({ following: toggleIn(st.following, p.id) })}>{st.following.includes(p.id) ? 'Following' : 'Follow'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card reveal" style={{ '--i': 2 }}>
            <h3>Your plan</h3>
            {plan.length === 0
              ? <p className="small muted" style={{ marginTop: 6 }}>Nothing yet. Hit "I'm going" on a session.</p>
              : <div className="stack" style={{ gap: 10, marginTop: 10 }}>
                {plan.map((s) => (
                  <div key={s.id} className="between">
                    <Link to={`/s/${s.id}`} className="small"><b>{s.title}</b><br /><span className="muted">{s.venue.name} · {fmtRel(s.start)} {fmtTime(s.start)}</span></Link>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn ghost sm" onClick={() => downloadIcs(s)}>.ics</button>
                      <button className="btn ghost sm" onClick={() => update({ going: st.going.filter((x) => x !== s.id) })}>✕</button>
                    </div>
                  </div>
                ))}
              </div>}
          </div>

          <div className="card reveal" style={{ '--i': 3 }}>
            <h3>What your people are doing</h3>
            <div className="stack" style={{ gap: 12, marginTop: 10 }}>
              {friendPlans.length === 0 && <p className="small muted">Follow someone to see their week.</p>}
              {friendPlans.map(({ p, sessions }) => (
                <div key={p.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <Avatar person={p} />
                  <div className="small" style={{ flex: 1 }}>
                    <b>{p.name}</b>
                    {sessions.length === 0 ? <div className="muted">Quiet this week.</div> : sessions.map((s) => <div key={s.id}><Link to={`/s/${s.id}`}>{s.title}</Link> <span className="muted">· {fmtRel(s.start)} {fmtTime(s.start)}</span></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card reveal" style={{ '--i': 4 }}>
            <h3>Prototype</h3>
            <p className="small muted" style={{ margin: '4px 0 10px' }}>Everything you do here lives in this browser only. Nobody else sees it.</p>
            <button className="btn ghost sm" onClick={() => { reset(); toast('Demo reset') }}>Reset demo</button>
          </div>
        </div>
      </div>
    </>
  )
}
