import { Link } from 'react-router-dom'
import { Avatar } from './bits.jsx'
import { personById } from '../data/people.js'
import { sessionById } from '../data/sessions.js'
import { hobbyById } from '../data/hobbies.js'
import { fmtTime, fmtRel } from '../lib/format.js'

export default function OpenSeatCard({ o, me, requested, onRequest, onRemove, i = 0 }) {
  const s = sessionById(o.sessionId)
  if (!s) return null
  const mine = !o.personId
  const person = mine ? { name: me.name || 'You', tint: 'var(--ink)' } : personById(o.personId)
  const hood = mine ? null : person.hood
  const hobby = hobbyById(s.hobby)
  return (
    <div className="card torn os reveal" style={{ '--i': i }}>
      <div className="who">
        <Avatar person={person} />
        <div style={{ flex: 1 }}>
          <div className="between">
            <div><b>{person.name}</b>{hood && <span className="muted small"> · {hood}</span>}{person.demo && <span className="stamp sample" style={{ marginLeft: 6 }}>Demo</span>}</div>
            <span className="tiny" style={{ color: hobby.tint }}>{hobby.name}</span>
          </div>
          {!mine && <div className="small muted">{person.blurb}</div>}
        </div>
        <div className="seatsn">{o.seats}<small>{o.seats === 1 ? 'seat' : 'seats'}</small></div>
      </div>
      <div className="say">“{o.say}”</div>
      <Link to={`/s/${s.id}`} className="at">
        <b>{s.title}</b> at {s.venue.name}<br />
        <span className="muted">{fmtRel(s.start)}, {fmtTime(s.start)}</span>
      </Link>
      <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
        {mine
          ? <button className="btn ghost sm" onClick={() => onRemove(o.id)}>Take down</button>
          : <button className={`btn sm ${requested ? 'on' : 'primary'}`} onClick={() => onRequest(o.id)}>{requested ? 'Asked ✓' : 'Ask to join'}</button>}
      </div>
    </div>
  )
}
