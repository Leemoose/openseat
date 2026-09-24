import { Link } from 'react-router-dom'
import { SOURCE_LABEL } from '../data/sessions.js'
import { PEOPLE } from '../data/people.js'
import { fmtTime, fmtRel, fmtPrice } from '../lib/format.js'
import { fmtMiles } from '../lib/geo.js'

export function Avatar({ person, lg }) {
  const initials = person.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return <span className={`av${lg ? ' lg' : ''}`} style={{ background: person.tint || 'var(--ink)' }} title={person.name}>{initials}</span>
}

export function Stamp({ source }) {
  return <span className={`stamp ${source}`}>{SOURCE_LABEL[source]}</span>
}

export function Seats({ taken, cap }) {
  if (cap >= 999) return <span className="seats">Open to all</span>
  const left = cap - taken
  return (
    <span className="seats">
      <span className="bar"><i style={{ width: `${Math.round((taken / cap) * 100)}%` }} /></span>
      {left <= 0 ? 'Full' : `${left} of ${cap} left`}
    </span>
  )
}

// Which followed people are at this session (from seed open seats + a light "going" mock).
export function friendsAt(session, following, openSeats) {
  const ids = new Set(openSeats.filter((o) => o.sessionId === session.id).map((o) => o.personId))
  return PEOPLE.filter((p) => following.includes(p.id) && ids.has(p.id))
}

export function SessionCard({ s, miles, friends = [], i = 0, going }) {
  return (
    <Link to={`/s/${s.id}`} className="card link sess reveal" style={{ '--i': i }}>
      <div className="when">
        <div className="t">{fmtTime(s.start)}</div>
        <div className="d">{fmtRel(s.start)}</div>
      </div>
      <div>
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div className="title">{s.title}</div>
          <Stamp source={s.source} />
        </div>
        <div className="meta">{s.venue.name}{miles != null && <> · {fmtMiles(miles)}</>}{s.recurring && <> · every {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.weekday]}</>}</div>
        <div className="row">
          <Seats taken={s.taken} cap={s.cap} />
          <span className="row" style={{ gap: 8 }}>
            {friends.length > 0 && <span className="avs">{friends.map((p) => <Avatar key={p.id} person={p} />)}</span>}
            {going && <span className="tiny" style={{ color: 'var(--moss)' }}>You're going</span>}
            <span className="price">{fmtPrice(s.price)}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
