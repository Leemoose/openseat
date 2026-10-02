import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sessionById, SESSIONS } from '../data/sessions.js'
import { hobbyById } from '../data/hobbies.js'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { seriesForSession } from '../lib/series.js'
import { fmtDayLong, fmtTime, weekdayName } from '../lib/format.js'
import { offerFor, holdLink, recordHold, recordHoldView } from '../lib/intent.js'
import { Seats, Stamp } from '../components/bits.jsx'
import VenueMap from '../components/VenueMap.jsx'
import { toast } from '../App.jsx'

export default function Session() {
  const { id } = useParams()
  const s = sessionById(id)
  const [st] = useStore()

  // The hold card was shown: the denominator for the hold rate. Once per
  // session page, not per re-render.
  useEffect(() => { if (s) recordHoldView(s) }, [s?.id])

  if (!s) return <div className="empty">That session has passed or does not exist. <Link to="/">Explore</Link></div>
  const hobby = hobbyById(s.hobby)
  const series = seriesForSession(s)
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  // "Book at Philadelphia" is what taking the first word of "Philadelphia Rock
  // Gym Fishtown" produces. The host is short, accurate and tells you where the
  // link goes, which is the point of the link.
  const nextSame = SESSIONS.filter((x) => x.venueId === s.venueId && x.title === s.title && x.id !== s.id).slice(0, 3)
  const offer = offerFor(s)

  return (
    <>
      <div className="crumb">
        <Link to="/">All hobbies</Link> <span>/</span> <Link to={`/h/${s.hobby}`}>{hobby.name}</Link> <span>/</span> <b>{s.title}</b>
      </div>
      <div className="band reveal" style={{ '--tint': hobby.tint, marginTop: 10 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <Stamp source={s.source} />
          {s.recurring && <span className="tiny">{series?.cadence || `Every ${weekdayName(s.weekday)}`}</span>}
        </div>
        <h1>{s.title}</h1>
        <p style={{ marginTop: 8, fontSize: '1.1rem' }}><b>{fmtDayLong(s.start)}</b>, {fmtTime(s.start)} to {fmtTime(s.end)}</p>
        <p className="muted">{s.venue.name} · {s.venue.address} · {fmtMiles(milesBetween(here, s.venue))} from {here.name}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <Seats cap={s.cap} />
          <span className="chip">{s.level}</span>
        </div>
      </div>

      {/* The one thing worth charging for. Access to a calendar is free
          everywhere; a seat already held for you on the night is not. This is
          the Member plan's buried fourth bullet promoted to the product, and
          it is the ask placed at the moment of intent instead of on a pricing
          page nobody reaches.

          The price model is the experiment: half of visitors see a monthly
          membership, half see a small per-booking fee. See lib/track.js. */}
      <div className="card hold reveal" style={{ marginTop: 18 }}>
        <div className="between" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 20rem' }}>
            <h3>Want us to hold a seat?</h3>
            <p className="small muted" style={{ marginTop: 6, maxWidth: '46ch' }}>
              We reserve one at this session and tell you it is yours. No account, no
              booking to work out, nothing to cancel by phone. Bring someone or come alone.
            </p>
            <p className="small" style={{ marginTop: 8, maxWidth: '46ch' }}>{offer.blurb}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="amt" style={{ marginBottom: 8 }}>
              ${offer.amount % 1 ? offer.amount.toFixed(2) : offer.amount}<small>{offer.unit}</small>
            </div>
            <a
              className="btn primary"
              href={holdLink(s)}
              target="_blank"
              rel="noreferrer"
              onClick={() => { recordHold(s); toast('Thank you. Tell us who you are and we will confirm.') }}
            >{offer.button} ↗</a>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Prototype: nothing is charged and no seat is really held yet. We are counting
          who taps this, which is the only honest way to find out whether it is worth building.
        </p>
      </div>

      <div className="grid two" style={{ marginTop: 24 }}>
        <VenueMap venues={[s.venue]} tint={hobby.tint} center={s.venue} zoom={14} />
        {nextSame.length > 0 && (
          <div className="card">
            <h3>Same session, later</h3>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              {nextSame.map((x) => <Link key={x.id} to={`/s/${x.id}`} className="small">{fmtDayLong(x.start)}, {fmtTime(x.start)}</Link>)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
