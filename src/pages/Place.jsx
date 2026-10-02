import { Link, useParams } from 'react-router-dom'
import { placeById, allPlacesFor, paidPrograms, KIND_LABEL } from '../data/places.js'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { hoursList, isOpenNow, todayHours } from '../lib/hours.js'
import { fmtRel, fmtTime } from '../lib/format.js'
import { PriceTag } from '../components/bits.jsx'
import { isLiveHobby } from '../lib/series.js'
import VenueMap from '../components/VenueMap.jsx'

export default function Place() {
  const { id } = useParams()
  const p = placeById(id)
  const [st] = useStore()
  if (!p || !isLiveHobby(p.hobby)) return <div className="empty">No such place. <Link to="/">Explore</Link></div>
  const hobby = hobbyById(p.hobby)
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  const open = isOpenNow(p.hours)
  const today = todayHours(p.hours)
  const upcoming = SESSIONS.filter((s) => s.venueId === p.id).slice(0, 6)
  // A leaf page with no way onward is a dead end. Offer the nearest places of
  // the same kind, which is the comparison a visitor is actually making.
  const nearby = allPlacesFor(p.hobby)
    .filter((x) => x.id !== p.id && x.lat != null)
    .map((x) => ({ ...x, miles: milesBetween(p, x) }))
    // Same kind first, then genuinely nearest. Comparing kinds inside the
    // comparator is not a total order and left the distances shuffled.
    .sort((a, b) => ((a.kind === p.kind ? 0 : 1) - (b.kind === p.kind ? 0 : 1)) || (a.miles ?? 999) - (b.miles ?? 999))
    .slice(0, 4)
  const facts = [
    p.holes && `${p.holes} holes${p.par ? `, par ${p.par}` : ''}`,
    p.access, p.range === true && 'Driving range on site', p.rangeNote,
    ...(p.services || []),
  ].filter(Boolean)

  return (
    <>
      <div className="crumb">
        <Link to="/">All hobbies</Link> <span>/</span> <Link to={`/h/${p.hobby}`}>{hobby.name}</Link> <span>/</span> <b>{p.name}</b>
      </div>
      <div className="band reveal" style={{ '--tint': hobby.tint, marginTop: 10 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="chip" style={{ background: 'var(--paper)' }}>{KIND_LABEL[p.kind] || p.kind}</span>
          {open === true && <span className="tiny" style={{ color: 'var(--moss)' }}>● Open now</span>}
          {open === false && <span className="tiny">○ Closed now</span>}
        </div>
        <h1>{p.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{p.address}{p.lat != null && <> · {fmtMiles(milesBetween(here, p))} from {here.name}</>}</p>
        {/* Venues that publish no grid describe their hours in a paragraph, and
            an agent's "note" key can run to 500 characters. A "Today:" line is
            for opening times; anything longer belongs in the Hours table below. */}
        {today && today.text.length <= 80 && <p style={{ marginTop: 6 }}><b>Today:</b> {today.text}</p>}
        {today && today.text.length > 80 && <p className="small muted" style={{ marginTop: 6 }}>Hours vary, see below.</p>}
        {facts.length > 0 && <div className="chips" style={{ marginTop: 12 }}>{facts.map((f) => <span key={f} className="chip">{f}</span>)}</div>}
      </div>

      <div className="grid two" style={{ marginTop: 24, alignItems: 'start' }}>
        <div className="stack">
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
                    </div>
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
                    <PriceTag s={s} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {paidPrograms(p).length > 0 && upcoming.length === 0 && (
            <div className="card">
              <h3>Programs</h3>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                {paidPrograms(p).map((s, i) => {
                  const meta = [s.day, s.time].filter(Boolean).join(' ')
                  return <div key={i} className="small"><b>{s.title}</b>{meta && <> · {meta}</>}{s.note && <div className="muted">{s.note}</div>}</div>
                })}
              </div>
            </div>
          )}
          {nearby.length > 0 && (
            <div className="card">
              <h3>Nearby, same hobby</h3>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                {nearby.map((x) => (
                  <Link key={x.id} to={`/p/${x.id}`} className="small between" style={{ textDecoration: 'none' }}>
                    <span><b>{x.name}</b><br /><span className="muted">{KIND_LABEL[x.kind] || 'Place'} · {fmtMiles(x.miles)} away</span></span>
                  </Link>
                ))}
              </div>
              <Link className="small" to={`/h/${p.hobby}`} style={{ display: 'inline-block', marginTop: 10 }}>All {hobby.name.toLowerCase()} places →</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
