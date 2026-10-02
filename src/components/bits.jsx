import { Link } from 'react-router-dom'
import { SOURCE_LABEL } from '../data/sessions.js'
import { fmtTime, fmtRel, fmtPrice } from '../lib/format.js'
import { fmtMiles } from '../lib/geo.js'

export function Stamp({ source }) {
  if (source !== 'feed') return null
  return <span className={`stamp ${source}`}>{SOURCE_LABEL[source]}</span>
}

export function Seats({ cap }) {
  // Two different facts, and only one of them is ever sourced. Capacity comes
  // from a venue's own scheduler where it publishes one. How full that class
  // already is comes from nowhere: no calendar, feed or booking page we read
  // exposes it. So this says how big the room is and stops, rather than
  // rendering "3 of 8 left" off a number we made up.
  if (cap == null) return <span className="seats muted">Seats not published</span>
  if (cap >= 999) return <span className="seats">Open to all</span>
  return <span className="seats">Room for {cap}</span>
}

export function SessionCard({ s, miles, i = 0 }) {
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
          <Seats cap={s.cap} />
          <span className="price">{fmtPrice(s.price)}</span>
        </div>
      </div>
    </Link>
  )
}
