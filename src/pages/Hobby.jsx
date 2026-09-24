import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import venues from '../data/venues.json'
import gear from '../data/gear.json'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { dayKey, fmtDayLong, fmtRel, fmtTime, fmtPrice } from '../lib/format.js'
import { SessionCard, friendsAt, Stamp } from '../components/bits.jsx'
import VenueMap from '../components/VenueMap.jsx'
import { toast } from '../App.jsx'

export default function Hobby() {
  const { hobby: hid } = useParams()
  const hobby = hobbyById(hid)
  const [st, update] = useStore()
  const [tab, setTab] = useState('sessions')
  const [radius, setRadius] = useState(5)
  const [firstTime, setFirstTime] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [gps, setGps] = useState(null)

  const here = gps || HOODS.find((h) => h.id === st.me.hood) || HOODS[0]

  const list = useMemo(() => SESSIONS
    .filter((s) => s.hobby === hid)
    .map((s) => ({ s, miles: milesBetween(here, s.venue) }))
    .filter(({ s, miles }) => (miles == null || miles <= radius) && (!firstTime || s.level === 'First time welcome') && (!freeOnly || s.price === 0)),
  [hid, here, radius, firstTime, freeOnly])

  const byDay = useMemo(() => {
    const m = new Map()
    for (const x of list) { const k = dayKey(x.s.start); if (!m.has(k)) m.set(k, []); m.get(k).push(x) }
    return [...m.values()]
  }, [list])

  const hobbyVenues = venues.filter((v) => v.hobby === hid).map((v) => ({ ...v, miles: milesBetween(here, v), next: SESSIONS.find((s) => s.venueId === v.id) })).sort((a, b) => (a.miles ?? 99) - (b.miles ?? 99))

  if (!hobby) return <div className="empty">No such hobby. <Link to="/">Back</Link></div>

  function locate() {
    if (!navigator.geolocation) return toast('No location access in this browser')
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ id: 'gps', name: 'your location', lat: p.coords.latitude, lng: p.coords.longitude }); toast('Using your location') },
      () => toast('Location blocked, using neighborhood instead'),
      { timeout: 6000 },
    )
  }

  const tabs = [['sessions', `Sessions (${list.length})`], ['places', `Places (${hobbyVenues.length})`]]
  if (hid === 'guitar') tabs.push(['gear', `Used gear (${gear.length})`])

  return (
    <>
      <div className="band reveal" style={{ '--tint': hobby.tint }}>
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="tiny" style={{ color: hobby.tint }}>Philadelphia</div>
            <h1>{hobby.name}</h1>
            <p className="muted" style={{ marginTop: 6, maxWidth: '48ch' }}>{hobby.blurb} {hobby.primary ? 'Sessions read from venue calendars where we can, sample where we cannot yet.' : 'Thin on purpose: this hobby is not in the first four.'}</p>
          </div>
          <div className="g">{hobby.glyph}</div>
        </div>
      </div>

      <div className="controls">
        <label className="field">Near
          <select value={gps ? 'gps' : st.me.hood} onChange={(e) => { if (e.target.value === 'gps') locate(); else { setGps(null); update({ me: { ...st.me, hood: e.target.value } }) } }}>
            {HOODS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            <option value="gps">Use my location</option>
          </select>
        </label>
        <label className="field">Within <b className="mono">{radius} mi</b>
          <input type="range" min="1" max="25" value={radius} onChange={(e) => setRadius(+e.target.value)} />
        </label>
        <button className={`chip${firstTime ? ' on' : ''}`} onClick={() => setFirstTime(!firstTime)}>First time welcome</button>
        <button className={`chip${freeOnly ? ' on' : ''}`} onClick={() => setFreeOnly(!freeOnly)}>Free</button>
      </div>

      <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'sessions' && (
        byDay.length === 0
          ? <div className="empty" style={{ marginTop: 20 }}>Nothing within {radius} miles with those filters. Widen the radius.</div>
          : byDay.map((day, di) => (
            <div key={di}>
              <div className="day-h">{fmtRel(day[0].s.start)} <small>{fmtDayLong(day[0].s.start)}</small></div>
              <div className="grid two">
                {day.map(({ s, miles }, i) => <SessionCard key={s.id} s={s} miles={miles} i={i} friends={friendsAt(s, st.following, SEED_OPEN_SEATS)} going={st.going.includes(s.id)} />)}
              </div>
            </div>
          ))
      )}

      {tab === 'places' && (
        <div className="stack" style={{ marginTop: 20 }}>
          <VenueMap venues={hobbyVenues} tint={hobby.tint} center={here} you={here} zoom={12} />
          <div className="grid two">
            {hobbyVenues.map((v, i) => (
              <div key={v.id} className="card reveal" style={{ '--i': i }}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3>{v.name}</h3>
                    <div className="small muted">{v.address}{v.miles != null && <> · {fmtMiles(v.miles)}</>}</div>
                  </div>
                </div>
                {v.next
                  ? <Link to={`/s/${v.next.id}`} className="small" style={{ display: 'block', marginTop: 10 }}>Next: <b>{v.next.title}</b>, {fmtRel(v.next.start)} {fmtTime(v.next.start)} · {fmtPrice(v.next.price)} <Stamp source={v.next.source} /></Link>
                  : <div className="small muted" style={{ marginTop: 10 }}>No sessions read yet. Adapter pending.</div>}
                <div className="row" style={{ marginTop: 12 }}>
                  <a className="btn ghost sm" href={v.url} target="_blank" rel="noreferrer">Venue site ↗</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'gear' && (
        <div className="stack" style={{ marginTop: 20 }}>
          <div className="note">Live snapshot from Reverb's public listings API (used, $150-1,200, ships within the US), pulled 2026-09-24. Local used racks worth walking into: DiPinto, Vintage Instruments, Russo. Buying on Reverb stays on Reverb; we take nothing.</div>
          <div className="gear">
            {gear.map((g, i) => (
              <a key={g.id} href={g.url} target="_blank" rel="noreferrer" className="reveal" style={{ '--i': i % 8 }}>
                {g.thumb ? <img src={g.thumb} alt="" loading="lazy" /> : <div style={{ aspectRatio: '1', background: 'var(--paper-3)' }} />}
                <div className="b">
                  <div className="t">{g.title}</div>
                  <div className="p">{g.price}</div>
                  <div className="s">{g.condition} · {g.type} · {g.shop}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
