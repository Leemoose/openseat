import { Link } from 'react-router-dom'
import { HobbyTag, PriceTag, Stamp } from './bits.jsx'
import { fmtClock, fmtRel, fmtTime, dayShort } from '../lib/format.js'
import { fmtMiles } from '../lib/geo.js'

// The card for a repeating class. The left rail carries the pattern ("TUE THU")
// rather than a single clock time, because the pattern is the thing you are
// deciding about: can I make this a habit, not can I make this Thursday.
// "Mon Tue Wed Thu" is four lines in a narrow rail; "Mon-Thu" is one. Collapse
// a contiguous run, and cap the rest so the rail never sets the card's height.
function pattern(days, recurring) {
  if (!recurring || !days.length) return 'One-off'
  if (days.length === 7) return 'Daily'
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Weekdays'
  if (days.length === 2 && days[0] === 0 && days[1] === 6) return 'Weekends'
  const contiguous = days.length > 2 && days.every((d, i) => i === 0 || d === days[i - 1] + 1)
  if (contiguous) return `${dayShort(days[0])}-${dayShort(days[days.length - 1])}`
  if (days.length <= 3) return days.map(dayShort).join(' ')
  return `${days.slice(0, 2).map(dayShort).join(' ')} +${days.length - 2}`
}

export default function SeriesCard({ s, miles, i = 0 }) {
  return (
    <Link to={`/s/${s.next.id}`} className="card link ser reveal" style={{ '--i': i }}>
      <div className="cad">
        <div className="tm">{fmtClock(s.times[0])}{s.times.length > 1 && <small>+{s.times.length - 1}</small>}</div>
        <div className="d">{pattern(s.days, s.recurring)}</div>
      </div>
      <div className="bd">
        <HobbyTag hobby={s.hobby} />
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div className="title">{s.title}</div>
          <Stamp source={s.source} />
        </div>
        <div className="meta">{s.venue.name}{miles != null && <> · {fmtMiles(miles)}</>}</div>
        <div className="row">
          {s.beginner && <span className="chip beg">First time welcome</span>}
          <PriceTag s={s.next} />
        </div>
        <div className="nx">Next {fmtRel(s.next.start).toLowerCase()}, {fmtTime(s.next.start)}{s.count > 1 && <> · {s.count} times in 4 weeks</>}</div>
      </div>
    </Link>
  )
}
