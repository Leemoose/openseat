import { Link } from 'react-router-dom'
import { KIND_LABEL, paidPrograms } from '../data/places.js'
import { fmtMiles } from '../lib/geo.js'
import { isOpenNow, todayHours } from '../lib/hours.js'

export default function PlaceCard({ p, miles, i = 0 }) {
  const open = isOpenNow(p.hours)
  const today = todayHours(p.hours)
  return (
    <Link to={`/p/${p.id}`} className="card link place reveal" style={{ '--i': i }}>
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="tiny">{KIND_LABEL[p.kind] || p.kind}{p.holes ? ` · ${p.holes} holes` : ''}</div>
          <h3 style={{ marginTop: 2 }}>{p.name}</h3>
          <div className="small muted">{p.address}{miles != null && <> · {fmtMiles(miles)}</>}</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 8 }}>
        {open === true && <span className="tiny" style={{ color: 'var(--moss)' }}>● Open now</span>}
        {open === false && <span className="tiny">○ Closed</span>}
        {today && <span className="small muted">{today.text}</span>}
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        {p.pros?.length > 0 && <span className="chip">{p.pros.length} {p.pros.length === 1 ? 'pro' : 'pros'} teach here</span>}
        {paidPrograms(p).length > 0 && <span className="chip">{paidPrograms(p).length} recurring</span>}
        {p.range === true && <span className="chip">Range</span>}
      </div>
    </Link>
  )
}
