import { Link, useParams } from 'react-router-dom'
import { placeById, KIND_LABEL } from '../data/places.js'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { hoursList, isOpenNow, todayHours } from '../lib/hours.js'
import { fmtRel, fmtTime, fmtPrice } from '../lib/format.js'
import { Stamp } from '../components/bits.jsx'
import VenueMap from '../components/VenueMap.jsx'

function money(p) {
  if (p == null || p === '') return 'See site'
  if (typeof p === 'number') return `$${p % 1 ? p.toFixed(2) : p}`
  return String(p).startsWith('$') ? p : `$${p}`
}

export default function Place() {
  const { id } = useParams()
  const p = placeById(id)
  const [st] = useStore()
  if (!p) return <div className="empty">No such place. <Link to="/">Explore</Link></div>
  const hobby = hobbyById(p.hobby)
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  const open = isOpenNow(p.hours)
  const today = todayHours(p.hours)
  const upcoming = SESSIONS.filter((s) => s.venueId === p.id).slice(0, 6)
  const facts = [
    p.holes && `${p.holes} holes${p.par ? `, par ${p.par}` : ''}`,
    p.access, p.range === true && 'Driving range on site', p.rangeNote,
    ...(p.services || []),
  ].filter(Boolean)

  return (
    <>
      <div className="small"><Link to={`/h/${p.hobby}`} style={{ color: hobby.tint, fontWeight: 600, textDecoration: 'none' }}>← {hobby.name}</Link></div>
      <div className="band reveal" style={{ '--tint': hobby.tint, marginTop: 10 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="chip" style={{ background: 'var(--paper)' }}>{KIND_LABEL[p.kind] || p.kind}</span>
          {open === true && <span className="tiny" style={{ color: 'var(--moss)' }}>● Open now</span>}
          {open === false && <span className="tiny">○ Closed now</span>}
          {p.verified && <Stamp source="snapshot" />}
        </div>
        <h1>{p.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{p.address}{p.lat != null && <> · {fmtMiles(milesBetween(here, p))} from {here.name}</>}</p>
        {today && <p style={{ marginTop: 6 }}><b>Today:</b> {today.text}</p>}
        {facts.length > 0 && <div className="chips" style={{ marginTop: 12 }}>{facts.map((f) => <span key={f} className="chip">{f}</span>)}</div>}
        <div className="row" style={{ marginTop: 18 }}>
          {p.url && <a className="btn primary" href={p.url} target="_blank" rel="noreferrer">{p.booking ? `Book (${p.booking}) ↗` : 'Website ↗'}</a>}
          {p.phone && <a className="btn" href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a>}
        </div>
        {p.notes && <p className="small muted" style={{ marginTop: 14 }}>{p.notes}</p>}
      </div>

      <div className="grid two" style={{ marginTop: 24, alignItems: 'start' }}>
        <div className="stack">
          {p.fees?.length > 0 && (
            <div className="card">
              <h3>Rates</h3>
              <table className="fees">
                <tbody>
                  {p.fees.map((f, i) => (
                    <tr key={i}><td>{f.label}{f.note && <div className="small muted">{f.note}</div>}</td><td className="amt">{money(f.price)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hoursList(p.hours).length > 0 && (
            <div className="card">
              <h3>Hours</h3>
              <table className="fees">
                <tbody>{hoursList(p.hours).map(([k, v]) => <tr key={k} className={today?.key === k ? 'now' : ''}><td style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td><td className="amt" style={{ fontFamily: 'var(--body)', fontWeight: 500 }}>{v}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {p.pros?.length > 0 && (
            <div className="card">
              <h3>Lessons with</h3>
              <div className="stack" style={{ gap: 12, marginTop: 10 }}>
                {p.pros.map((pro, i) => (
                  <div key={i} className="between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <b>{pro.name}</b>
                      {pro.title && <div className="small muted">{pro.title}</div>}
                      {pro.url && <a className="small" href={pro.url} target="_blank" rel="noreferrer">Lesson info ↗</a>}
                    </div>
                    <div className="price">{pro.lessonPrice != null ? money(pro.lessonPrice) : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          {p.lat != null && <VenueMap venues={[p]} tint={hobby.tint} center={p} zoom={13} />}
          {upcoming.length > 0 && (
            <div className="card">
              <h3>Recurring here</h3>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                {upcoming.map((s) => (
                  <Link key={s.id} to={`/s/${s.id}`} className="small between" style={{ textDecoration: 'none' }}>
                    <span><b>{s.title}</b><br /><span className="muted">{fmtRel(s.start)}, {fmtTime(s.start)}</span></span>
                    <span className="price">{fmtPrice(s.price)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {p.sessions?.length > 0 && upcoming.length === 0 && (
            <div className="card">
              <h3>Programs</h3>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                {p.sessions.map((s, i) => <div key={i} className="small"><b>{s.title}</b> · {[s.day, s.time].filter(Boolean).join(' ')}{s.price != null && <> · {money(s.price)}</>}{s.note && <div className="muted">{s.note}</div>}</div>)}
              </div>
            </div>
          )}
          {p.sources?.length > 0 && (
            <div className="small muted">Checked {p.verified || 'recently'} against {[...new Map(p.sources.map((u) => [new URL(u).hostname.replace('www.', ''), u])).entries()].slice(0, 3).map(([h, u], i) => <span key={u}>{i > 0 && ', '}<a href={u} target="_blank" rel="noreferrer">{h}</a></span>)}. Rates change; the venue's site wins.</div>
          )}
        </div>
      </div>
    </>
  )
}
