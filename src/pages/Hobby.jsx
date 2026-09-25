import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { placesFor, KIND_LABEL, KIND_ORDER } from '../data/places.js'
import venues from '../data/venues.json'
import gear from '../data/gear.json'
import { HOODS, milesBetween, fmtMiles } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { dayKey, fmtDayLong, fmtRel, fmtTime, fmtPrice } from '../lib/format.js'
import { isOpenNow } from '../lib/hours.js'
import { SessionCard, friendsAt, Stamp } from '../components/bits.jsx'
import PlaceCard from '../components/PlaceCard.jsx'
import VenueMap from '../components/VenueMap.jsx'
import { toast } from '../App.jsx'

export default function Hobby() {
  const { hobby: hid } = useParams()
  const hobby = hobbyById(hid)
  const [st, update] = useStore()
  const rich = placesFor(hid)
  const [tab, setTab] = useState(rich.length ? 'places' : 'sessions')
  const [radius, setRadius] = useState(rich.length ? 15 : 5)
  const [firstTime, setFirstTime] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(0) // 0 = any
  const [kind, setKind] = useState('all')
  const [openNow, setOpenNow] = useState(false)
  const [gps, setGps] = useState(null)

  const here = gps || HOODS.find((h) => h.id === st.me.hood) || HOODS[0]

  const list = useMemo(() => SESSIONS
    .filter((s) => s.hobby === hid)
    .map((s) => ({ s, miles: milesBetween(here, s.venue) }))
    .filter(({ s, miles }) => (miles == null || miles <= radius) && (!firstTime || s.level === 'First time welcome') && (!freeOnly || s.price === 0) && (!maxPrice || s.price == null || s.price <= maxPrice)),
  [hid, here, radius, firstTime, freeOnly, maxPrice])

  const byDay = useMemo(() => {
    const m = new Map()
    for (const x of list) { const k = dayKey(x.s.start); if (!m.has(k)) m.set(k, []); m.get(k).push(x) }
    return [...m.values()]
  }, [list])

  const kinds = useMemo(() => KIND_ORDER.filter((k) => rich.some((p) => p.kind === k)), [rich])
  const richList = useMemo(() => rich
    .map((p) => ({ ...p, miles: milesBetween(here, p) }))
    .filter((p) => (p.miles == null || p.miles <= radius) && (kind === 'all' || p.kind === kind) && (!maxPrice || p.fromPrice == null || p.fromPrice <= maxPrice) && (!openNow || isOpenNow(p.hours) === true))
    .sort((a, b) => (a.miles ?? 99) - (b.miles ?? 99)),
  [rich, here, radius, kind, maxPrice, openNow])

  const thinVenues = venues.filter((v) => v.hobby === hid).map((v) => ({ ...v, miles: milesBetween(here, v), next: SESSIONS.find((s) => s.venueId === v.id) })).sort((a, b) => (a.miles ?? 99) - (b.miles ?? 99))

  if (!hobby) return <div className="empty">No such hobby. <Link to="/">Back</Link></div>

  function locate() {
    if (!navigator.geolocation) return toast('No location access in this browser')
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ id: 'gps', name: 'your location', lat: p.coords.latitude, lng: p.coords.longitude }); toast('Using your location') },
      () => toast('Location blocked, using neighborhood instead'),
      { timeout: 6000 },
    )
  }

  const tabs = rich.length
    ? [['places', `Places (${richList.length})`], ['sessions', `Sessions (${list.length})`]]
    : [['sessions', `Sessions (${list.length})`], ['places', `Places (${thinVenues.length})`]]
  if (hid === 'guitar') tabs.push(['gear', `Used gear (${gear.length})`])

  const priceCap = rich.length ? 150 : 120

  return (
    <>
      <div className="band reveal" style={{ '--tint': hobby.tint }}>
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="tiny" style={{ color: hobby.tint }}>Philadelphia</div>
            <h1>{hobby.name}</h1>
            <p className="muted" style={{ marginTop: 6, maxWidth: '48ch' }}>{hobby.blurb} {rich.length ? `${rich.length} places with rates, hours and instructors checked against their own sites.` : hobby.primary ? 'Sessions read from venue calendars where we can, sample where we cannot yet.' : 'Thin on purpose: this hobby is not in the first four.'}</p>
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
          <input type="range" min="1" max="30" value={radius} onChange={(e) => setRadius(+e.target.value)} />
        </label>
        <label className="field">Up to <b className="mono">{maxPrice ? `$${maxPrice}` : 'any $'}</b>
          <input type="range" min="0" max={priceCap} step="5" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} />
        </label>
        {tab === 'sessions' && <>
          <button className={`chip${firstTime ? ' on' : ''}`} onClick={() => setFirstTime(!firstTime)}>First time welcome</button>
          <button className={`chip${freeOnly ? ' on' : ''}`} onClick={() => setFreeOnly(!freeOnly)}>Free</button>
        </>}
        {tab === 'places' && rich.length > 0 && <button className={`chip${openNow ? ' on' : ''}`} onClick={() => setOpenNow(!openNow)}>Open now</button>}
      </div>

      <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'sessions' && (
        byDay.length === 0
          ? <div className="empty" style={{ marginTop: 20 }}>Nothing within {radius} miles with those filters. Widen the radius or the price.</div>
          : byDay.map((day, di) => (
            <div key={di}>
              <div className="day-h">{fmtRel(day[0].s.start)} <small>{fmtDayLong(day[0].s.start)}</small></div>
              <div className="grid two">
                {day.map(({ s, miles }, i) => <SessionCard key={s.id} s={s} miles={miles} i={i} friends={friendsAt(s, st.following, SEED_OPEN_SEATS)} going={st.going.includes(s.id)} />)}
              </div>
            </div>
          ))
      )}

      {tab === 'places' && rich.length > 0 && (
        <div className="stack" style={{ marginTop: 20 }}>
          {kinds.length > 1 && (
            <div className="chips">
              <button className={`chip${kind === 'all' ? ' on' : ''}`} onClick={() => setKind('all')}>All</button>
              {kinds.map((k) => <button key={k} className={`chip${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>{KIND_LABEL[k]} · {rich.filter((p) => p.kind === k).length}</button>)}
            </div>
          )}
          <VenueMap venues={richList} tint={hobby.tint} center={here} you={here} zoom={radius > 12 ? 10 : 11} />
          {richList.length === 0
            ? <div className="empty">Nothing within {radius} miles with those filters.</div>
            : <div className="grid two">{richList.map((p, i) => <PlaceCard key={p.id} p={p} miles={p.miles} i={i} />)}</div>}
        </div>
      )}

      {tab === 'places' && rich.length === 0 && (
        <div className="stack" style={{ marginTop: 20 }}>
          <VenueMap venues={thinVenues} tint={hobby.tint} center={here} you={here} zoom={12} />
          <div className="grid two">
            {thinVenues.map((v, i) => (
              <div key={v.id} className="card reveal" style={{ '--i': i }}>
                <h3>{v.name}</h3>
                <div className="small muted">{v.address}{v.miles != null && <> · {fmtMiles(v.miles)}</>}</div>
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
