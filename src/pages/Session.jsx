import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sessionById, SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { hobbyById } from '../data/hobbies.js'
import { PEOPLE } from '../data/people.js'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore, toggleIn } from '../lib/store.js'
import { seriesForSession } from '../lib/series.js'
import { downloadIcs, googleCalendarUrl } from '../lib/ics.js'
import { fmtDayLong, fmtTime, fmtPrice, weekdayName } from '../lib/format.js'
import { offerFor, holdLink, recordHold, recordHoldView, recordClickOut } from '../lib/intent.js'
import { track } from '../lib/track.js'
import { Avatar, Seats, Stamp } from '../components/bits.jsx'
import OpenSeatCard from '../components/OpenSeatCard.jsx'
import VenueMap from '../components/VenueMap.jsx'
import { toast } from '../App.jsx'

export default function Session() {
  const { id } = useParams()
  const s = sessionById(id)
  const [st, update] = useStore()
  const [seats, setSeats] = useState(1)
  const [say, setSay] = useState('')
  const [invite, setInvite] = useState('')

  // The hold card was shown: the denominator for the hold rate. Once per
  // session page, not per re-render.
  useEffect(() => { if (s) recordHoldView(s) }, [s?.id])

  if (!s) return <div className="empty">That session has passed or does not exist. <Link to="/">Explore</Link></div>
  const hobby = hobbyById(s.hobby)
  const series = seriesForSession(s)
  const here = HOODS.find((h) => h.id === st.me.hood) || HOODS[0]
  // "Book at Philadelphia" is what taking the first word of "Philadelphia Rock
  // Gym Fishtown" produces. The host is short, accurate and tells you where the
  // link goes, which is the point of the button.
  const bookHost = (() => { try { return new URL(s.url).hostname.replace('www.', '') } catch { return null } })()
  const going = st.going.includes(s.id)
  const open = [...st.myOpenSeats.filter((o) => o.sessionId === s.id), ...SEED_OPEN_SEATS.filter((o) => o.sessionId === s.id && !st.hidden.includes(o.id))]
  const friends = PEOPLE.filter((p) => st.following.includes(p.id) && open.some((o) => o.personId === p.id))
  const nextSame = SESSIONS.filter((x) => x.venueId === s.venueId && x.title === s.title && x.id !== s.id).slice(0, 3)
  const offer = offerFor(s)

  function post() {
    if (!say.trim()) return toast('Say one line about who you are')
    const o = { id: `me-${Date.now()}`, sessionId: s.id, seats, say: say.trim(), createdAt: Date.now() }
    update({ myOpenSeats: [o, ...st.myOpenSeats], going: going ? st.going : [...st.going, s.id] })
    track('open_seat_post', { session_id: s.id, hobby: s.hobby, seats })
    setSay('')
    toast('Open seat posted')
  }

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
          <span className="price" style={{ fontSize: '1.4rem' }}>{fmtPrice(s.price)}</span>
          <Seats cap={s.cap} />
          <span className="chip">{s.level}</span>
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <button className={`btn ${going ? 'on' : 'primary'}`} onClick={() => { update({ going: toggleIn(st.going, s.id) }); track(going ? 'going_off' : 'going_on', { session_id: s.id, hobby: s.hobby }); toast(going ? 'Removed from your plan' : 'Added to your plan') }}>{going ? "You're going ✓" : "I'm going"}</button>
          {/* Every path off this site used to leave no trace, so a fill could
              not be counted and there was nothing to show a venue. */}
          <a className="btn" href={s.url} target="_blank" rel="noreferrer" onClick={() => recordClickOut(s.venueId, s.id, { hobby: s.hobby, source: s.source })}>Book at {bookHost || 'the venue'} ↗</a>
        </div>
        {s.note && <p className="small muted" style={{ marginTop: 14 }}>{s.note}</p>}
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
              {offer.amount != null ? <>${offer.variant === 'sub' ? offer.amount : offer.amount.toFixed(2)}<small>{offer.unit}</small></> : <small>{offer.label}</small>}
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
        <div className="stack">
          <div className="card">
            <h3>Put it on your calendar</h3>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>Nothing to sign in to. A calendar file, or a one-click Google add.</p>
            <div className="row">
              <button className="btn sm" onClick={() => downloadIcs(s, { description: 'Found on OpenSeat.' })}>Download .ics</button>
              <a className="btn sm" href={googleCalendarUrl(s, { description: 'Found on OpenSeat.' })} target="_blank" rel="noreferrer">Google Calendar ↗</a>
            </div>
            <hr className="rule" style={{ margin: '16px 0' }} />
            <h3>Invite a friend</h3>
            <p className="small muted" style={{ margin: '6px 0 10px' }}>Opens a Google Calendar invite with them as a guest. In the real thing, they'd get it in-app.</p>
            <div className="form">
              <input type="text" placeholder="friend@email.com" value={invite} onChange={(e) => setInvite(e.target.value)} />
              <a className={`btn sm moss${invite.includes('@') ? '' : ' ghost'}`} href={invite.includes('@') ? googleCalendarUrl(s, { description: `${st.me.name} invited you via OpenSeat.`, guests: invite }) : undefined} target="_blank" rel="noreferrer" onClick={(e) => { if (!invite.includes('@')) { e.preventDefault(); toast('Enter an email first') } }}>Send invite ↗</a>
            </div>
          </div>

          <div className="card">
            <h3>Open a seat</h3>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>You're going anyway. Say who you are and how many can join. It shows up in the open seats feed.</p>
            <div className="form">
              <label>Seats you're opening</label>
              <div className="chips">{[1, 2, 3, 4].map((n) => <button key={n} className={`chip${seats === n ? ' on' : ''}`} onClick={() => setSeats(n)}>{n}</button>)}</div>
              <label>One line about you and this</label>
              <textarea placeholder="e.g. Second time on the wheel. Happy to sit with anyone who is also new." value={say} onChange={(e) => setSay(e.target.value)} maxLength={200} />
              <button className="btn primary" onClick={post}>Post open seat</button>
            </div>
          </div>
        </div>

        <div className="stack">
          <VenueMap venues={[s.venue]} tint={hobby.tint} center={s.venue} zoom={14} />
          {friends.length > 0 && (
            <div className="card"><div className="row"><span className="avs">{friends.map((p) => <Avatar key={p.id} person={p} />)}</span><span className="small"><b>{friends.map((p) => p.name).join(', ')}</b> {friends.length === 1 ? 'is' : 'are'} going</span></div></div>
          )}
          {open.length > 0 && <div className="sec-h" style={{ marginBottom: 0 }}><h3>Open seats at this session</h3></div>}
          {open.map((o, i) => (
            <OpenSeatCard key={o.id} o={o} i={i} me={st.me} requested={st.requested.includes(o.id)}
              onRequest={(oid) => { update({ requested: toggleIn(st.requested, oid) }); toast(st.requested.includes(oid) ? 'Request withdrawn' : 'Asked. They get a note with your profile.') }}
              onRemove={(oid) => update({ myOpenSeats: st.myOpenSeats.filter((x) => x.id !== oid) })} />
          ))}
          {nextSame.length > 0 && (
            <div className="card">
              <h3>Same session, later</h3>
              <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                {nextSame.map((x) => <Link key={x.id} to={`/s/${x.id}`} className="small">{fmtDayLong(x.start)}, {fmtTime(x.start)}</Link>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
