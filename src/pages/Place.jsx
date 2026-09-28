import { Link, useParams } from 'react-router-dom'
import { placeById, allPlacesFor, KIND_LABEL } from '../data/places.js'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { hoursList, isOpenNow, todayHours } from '../lib/hours.js'
import { fmtRel, fmtTime, fmtPrice } from '../lib/format.js'
import { Stamp } from '../components/bits.jsx'
import { recordClickOut, recordWent, clicksFor, wentFor, pendingClick } from '../lib/intent.js'
import VenueMap from '../components/VenueMap.jsx'

const PLATFORM_LABEL = {
  'wordpress-tribe': 'WordPress with The Events Calendar',
  wordpress: 'WordPress',
  squarespace: 'Squarespace',
  acuity: 'Acuity Scheduling',
  mindbody: 'Mindbody',
  punchpass: 'Punchpass',
  sawyer: 'Sawyer',
  wix: 'Wix',
  eventbrite: 'Eventbrite',
  bookwhen: 'Bookwhen',
  coursestorm: 'CourseStorm',
  jackrabbit: 'Jackrabbit',
  ticketleap: 'Ticketleap',
  kilnfire: 'KilnFire',
  apostrophecms: 'ApostropheCMS',
  shopify: 'Shopify',
  drupal: 'Drupal',
  webflow: 'Webflow',
  'square-online': 'Square Online',
  captyn: 'Captyn',
  none: 'a site with no online schedule',
  unknown: 'something we could not identify',
}

// Several venues run a stack ("wordpress + acuity + kilnfire"). Label each part.
function platformName(p) {
  return String(p || '').split(/\s*\+\s*/)
    .map((x) => PLATFORM_LABEL[x.trim().toLowerCase()] || x.trim())
    .filter(Boolean).join(' + ')
}

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
  const clicks = clicksFor(st, p.id)
  const went = wentFor(st, p.id)
  const pending = pendingClick(st, p.id)
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
          {p.verified && <Stamp source="snapshot" />}
        </div>
        <h1>{p.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{p.address}{p.lat != null && <> · {fmtMiles(milesBetween(here, p))} from {here.name}</>}</p>
        {/* Venues that publish no grid describe their hours in a paragraph, and
            an agent's "note" key can run to 500 characters. A "Today:" line is
            for opening times; anything longer belongs in the Hours table below. */}
        {today && today.text.length <= 80 && <p style={{ marginTop: 6 }}><b>Today:</b> {today.text}</p>}
        {today && today.text.length > 80 && <p className="small muted" style={{ marginTop: 6 }}>Hours vary, see below.</p>}
        {facts.length > 0 && <div className="chips" style={{ marginTop: 12 }}>{facts.map((f) => <span key={f} className="chip">{f}</span>)}</div>}
        <div className="row" style={{ marginTop: 18 }}>
          {/* `booking` is sometimes a system name ("Sawyer") and sometimes a
              paragraph explaining that the venue runs two of them. A button is
              not the place for the paragraph; it goes to the research notes. */}
          {p.url && <a className="btn primary" href={p.url} target="_blank" rel="noreferrer" onClick={() => recordClickOut(p.id)}>
            {p.booking && p.booking.length <= 28 ? `Book (${p.booking}) ↗` : 'Book on their site ↗'}
          </a>}
          {p.phone && <a className="btn" href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a>}
        </div>
      </div>

      {/* The number a venue would actually pay against, and the project's
          stated metric. Nothing here measured whether a single person went
          anywhere until now: every booking link was an untracked _blank. */}
      {pending && (
        <div className="card askwent reveal" style={{ marginTop: 14 }}>
          <div className="between" style={{ gap: 12, flexWrap: 'wrap' }}>
            <b>You opened {p.name}'s booking page. Did you book?</b>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm primary" onClick={() => recordWent(p.id, pending.sessionId)}>Yes, I booked</button>
              <button className="btn sm ghost" onClick={() => recordWent(p.id, pending.sessionId)}>Not this time</button>
            </div>
          </div>
        </div>
      )}
      {(clicks > 0 || went > 0) && !pending && (
        <p className="small muted" style={{ marginTop: 14 }}>
          {went > 0
            ? `${went} ${went === 1 ? 'booking' : 'bookings'} from OpenSeat at this venue.`
            : `${clicks} ${clicks === 1 ? 'visit' : 'visits'} to this venue's booking page from OpenSeat.`}
          {' '}Counted in this browser only, which is as far as a prototype with no backend can honestly go.
        </p>
      )}

      <div className="grid two" style={{ marginTop: 24, alignItems: 'start' }}>
        <div className="stack">
          {!p.fees?.length && !p.thin && (
            <div className="card">
              <h3>Rates</h3>
              {/* Not an empty state to hide. "You cannot find out what this
                  costs without calling" is exactly the problem this product
                  exists to fix, so it gets said plainly. */}
              <p className="small muted" style={{ marginTop: 8 }}>
                This venue publishes no prices online. We checked the site and the booking system; you have to ask.
              </p>
            </div>
          )}
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
                {p.sessions.map((s, i) => {
                  // A program often has no day or no price; joining blanks left "· ·" on the line.
                  const meta = [[s.day, s.time].filter(Boolean).join(' '), s.price != null ? money(s.price) : null].filter(Boolean).join(' · ')
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
                    {x.fromPrice != null && <span className="price">${x.fromPrice % 1 ? x.fromPrice.toFixed(2) : x.fromPrice}</span>}
                  </Link>
                ))}
              </div>
              <Link className="small" to={`/h/${p.hobby}`} style={{ display: 'inline-block', marginTop: 10 }}>All {hobby.name.toLowerCase()} places →</Link>
            </div>
          )}
          {p.platform && (
            <div className="card">
              <h3>Can we read this calendar?</h3>
              <p className="small muted" style={{ margin: '6px 0 10px' }}>
                The whole premise is that a venue keeps its own schedule and we read it, rather than asking it to maintain a second listing here. So this is worth stating per venue.
              </p>
              {p.feedUrl
                ? <p className="small"><b style={{ color: 'var(--moss)' }}>● Yes.</b> {platformName(p.platform)} publishes a machine-readable schedule, so sessions here can update themselves.</p>
                : <p className="small"><b>○ Not yet.</b> Runs on {platformName(p.platform)}{p.platform === 'none' ? ', with no schedule published online at all' : ', which needs an adapter written for it'}. Sessions here are entered by hand and go stale.</p>}
            </div>
          )}
          {p.notes && (
            <details className="notes">
              <summary>Research notes</summary>
              {/* Written by whoever checked this venue, kept verbatim rather
                  than smoothed into marketing copy. Half of what is useful about
                  a venue is the caveat. */}
              <p className="small muted">{p.notes}</p>
            </details>
          )}
          {p.sources?.length > 0 && (
            <div className="small muted">Checked {p.verified || 'recently'} against {[...new Map(p.sources.map((u) => [new URL(u).hostname.replace('www.', ''), u])).entries()].slice(0, 3).map(([h, u], i) => <span key={u}>{i > 0 && ', '}<a href={u} target="_blank" rel="noreferrer">{h}</a></span>)}. Rates change; the venue's site wins.</div>
          )}
        </div>
      </div>
    </>
  )
}
