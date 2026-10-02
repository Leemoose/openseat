import { Link } from 'react-router-dom'
import { fmtTime, fmtRel } from '../lib/format.js'
import { offerFor } from '../lib/intent.js'
import { hobbyById } from '../data/hobbies.js'
import { fmtMiles } from '../lib/geo.js'

// Which hobby an event belongs to, drawn like the home page tiles. A venue
// name ("Community Arts Center") rarely says it is a pottery class.
export function HobbyTag({ hobby }) {
  const h = hobbyById(hobby)
  if (!h) return null
  return <span className="htag" style={{ '--tint': h.tint }}><span className="g">{h.glyph}</span>{h.name}</span>
}

// A card's price, with a course's commitment ("8 classes · $505 total")
// underneath in small type.
export function PriceTag({ s }) {
  const o = offerFor(s)
  return (
    <span className="pricetag">
      <span className="price">{o.short}</span>
      {o.commitment && <span className="commit">{o.commitment}</span>}
    </span>
  )
}

export function Seats({ cap }) {
  // Two different facts, and only one of them is ever sourced. Capacity comes
  // from a venue's own scheduler where it publishes one. How full that class
  // already is comes from nowhere: no calendar, feed or booking page we read
  // exposes it. So this says how big the room is and stops, rather than
  // rendering "3 of 8 left" off a number we made up.
  if (cap == null) return null
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
        <HobbyTag hobby={s.hobby} />
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div className="title">{s.title}</div>
        </div>
        <div className="meta">{s.venue.name}{miles != null && <> · {fmtMiles(miles)}</>}{s.recurring && <> · every {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.weekday]}</>}</div>
        <div className="row">
          <Seats cap={s.cap} />
          <PriceTag s={s} />
        </div>
      </div>
    </Link>
  )
}
