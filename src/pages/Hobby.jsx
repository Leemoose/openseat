import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { hobbyById } from '../data/hobbies.js'
import { SESSIONS } from '../data/sessions.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { allPlacesFor, placesFor, KIND_LABEL, KIND_ORDER } from '../data/places.js'
import gear from '../data/gear.json'
import { HOODS, milesBetween } from '../lib/geo.js'
import { useStore } from '../lib/store.js'
import { seriesFor, hobbyStats, sourceRank } from '../lib/series.js'
import { dayKey, fmtDayLong, fmtRel } from '../lib/format.js'
import { isOpenNow } from '../lib/hours.js'
import { SessionCard, friendsAt } from '../components/bits.jsx'
import SeriesCard from '../components/SeriesCard.jsx'
import PlaceCard from '../components/PlaceCard.jsx'
import VenueMap from '../components/VenueMap.jsx'
import { toast } from '../App.jsx'

const KIND_PLURAL = {
  studio: 'Studios', school: 'Art schools', supply: 'Clay & supplies', gallery: 'Galleries',
  course: 'Courses', range: 'Driving ranges', sim: 'Simulators', shop: 'Shops',
  fitter: 'Club fitters', academy: 'Lessons', place: 'Places',
}

export default function Hobby() {
  const { hobby: hid } = useParams()
  const hobby = hobbyById(hid)
  const [st, update] = useStore()
  const [sp, setSp] = useSearchParams()
  const [gps, setGps] = useState(null)
  const [showMap, setShowMap] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 720))
  const [openFilters, setOpenFilters] = useState(false)

  const rich = placesFor(hid)
  const places = allPlacesFor(hid)
  const series = useMemo(() => seriesFor(hid), [hid])
  const stats = useMemo(() => hobbyStats(hid), [hid])

  // Filters live in the URL so a filtered view is a link you can send or
  // bookmark. Written with replace so twenty slider nudges do not bury the
  // page you arrived from twenty entries deep in history.
  const setQ = (patch) => setSp((prev) => {
    const n = new URLSearchParams(prev)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || v === false || v === 0) n.delete(k); else n.set(k, String(v))
    }
    return n
  }, { replace: true })

  const view = sp.get('view') || (rich.length ? 'places' : 'classes')
  const nearId = sp.get('near') || st.me.hood
  const radius = +(sp.get('r') || (rich.length ? 15 : 5))
  const maxPrice = +(sp.get('max') || 0)
  const kind = sp.get('kind') || 'all'
  const beginner = sp.get('beg') === '1'
  const freeOnly = sp.get('free') === '1'
  const openNow = sp.get('open') === '1'
  const here = gps || HOODS.find((h) => h.id === nearId) || HOODS[0]

  if (!hobby) return <div className="empty">No such hobby. <Link to="/">Back to all hobbies</Link></div>

  function locate() {
    if (!navigator.geolocation) return toast('No location access in this browser')
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ id: 'gps', name: 'your location', lat: p.coords.latitude, lng: p.coords.longitude }); toast('Using your location') },
      () => toast('Location blocked, using neighborhood instead'),
      { timeout: 6000 },
    )
  }

  const near = (x) => { const m = milesBetween(here, x); return { m, ok: m == null || m <= radius } }
  const priceOk = (p) => !maxPrice || p == null || p <= maxPrice

  const seriesList = series
    .map((s) => ({ s, miles: near(s.venue).m, ok: near(s.venue).ok }))
    .filter(({ s, ok }) => ok && (!beginner || s.beginner) && (!freeOnly || s.price === 0) && priceOk(s.price))
  // "Start here" answers "what is the cheapest way to try this", so it leads
  // with price rather than with whichever class happens to run next. A $572
  // eight-week course at the top of a beginner list is the wrong first thing.
  // Cheapest first, then verified before plausible, so a guessed session never
  // outranks a real one at the same price in the list that says "start here".
  const firstTimers = seriesList.filter(({ s }) => s.beginner)
    .sort((a, b) => ((a.s.price ?? 9999) - (b.s.price ?? 9999)) || (sourceRank(a.s) - sourceRank(b.s)))
  const rest = seriesList.filter(({ s }) => !s.beginner)

  const dayList = SESSIONS
    .filter((s) => s.hobby === hid)
    .map((s) => ({ s, miles: near(s.venue).m, ok: near(s.venue).ok }))
    .filter(({ s, ok }) => ok && (!beginner || s.level === 'First time welcome') && (!freeOnly || s.price === 0) && priceOk(s.price))
  const byDay = groupByDay(dayList)

  const kinds = KIND_ORDER.filter((k) => places.some((p) => p.kind === k))
  const placeList = places
    .map((p) => ({ ...p, miles: near(p).m }))
    .filter((p) => near(p).ok && (kind === 'all' || p.kind === kind) && priceOk(p.fromPrice) && (!openNow || isOpenNow(p.hours) === true))
    .sort((a, b) => (a.miles ?? 99) - (b.miles ?? 99))
  const placeGroups = kind === 'all' && kinds.length > 1
    ? kinds.map((k) => [k, placeList.filter((p) => p.kind === k)]).filter(([, l]) => l.length)
    : [[kind === 'all' ? 'place' : kind, placeList]]

  // Lead with whatever this hobby actually has depth in: researched places for
  // golf, the class list everywhere else.
  const defaultView = rich.length ? 'places' : 'classes'
  const views = [
    ['classes', 'Classes', seriesList.length],
    ['places', 'Places', placeList.length],
    ['calendar', 'Calendar', dayList.length],
  ].sort((a, b) => (a[0] === defaultView ? -1 : b[0] === defaultView ? 1 : 0))
  if (hid === 'guitar') views.push(['gear', 'Used gear', gear.length])

  const activeFilters = [beginner, freeOnly, openNow, maxPrice > 0].filter(Boolean).length

  // One sentence that answers "is this worth a click" before any filtering.
  const summary = [
    `${stats.places} ${stats.places === 1 ? 'place' : 'places'}`,
    stats.series ? `${stats.series} ${stats.series === 1 ? 'class' : 'classes'}` : null,
    stats.free ? 'some free' : stats.from != null ? `from $${stats.from}` : null,
    stats.beginner ? `${stats.beginner} welcome first-timers` : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <div className="crumb"><Link to="/">All hobbies</Link> <span>/</span> <b>{hobby.name}</b></div>

      <div className="hband reveal" style={{ '--tint': hobby.tint }}>
        <span className="g">{hobby.glyph}</span>
        <div>
          <h1>{hobby.name}</h1>
          <p className="sum">{summary}</p>
        </div>
      </div>

      <div className="tabs">
        {views.map(([k, l, n]) => (
          <button key={k} className={view === k ? 'on' : ''} onClick={() => setQ({ view: k === defaultView ? null : k })}>
            {l} <small>{n}</small>
          </button>
        ))}
      </div>

      <div className="filtbar">
        <label className="field">Near
          <select value={gps ? 'gps' : nearId} onChange={(e) => {
            if (e.target.value === 'gps') locate()
            else { setGps(null); setQ({ near: e.target.value }); update({ me: { ...st.me, hood: e.target.value } }) }
          }}>
            {HOODS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            <option value="gps">Use my location</option>
          </select>
        </label>
        <label className="field">Within <b className="mono">{radius} mi</b>
          <input type="range" min="1" max="30" value={radius} onChange={(e) => setQ({ r: e.target.value })} />
        </label>
        <button className={`chip more${activeFilters ? ' on' : ''}`} onClick={() => setOpenFilters(!openFilters)}>
          Filters{activeFilters ? ` · ${activeFilters}` : ''}
        </button>
        <div className={`morefilt${openFilters ? ' open' : ''}`}>
          <label className="field">Up to <b className="mono">{maxPrice ? `$${maxPrice}` : 'any $'}</b>
            <input type="range" min="0" max={rich.length ? 150 : 120} step="5" value={maxPrice} onChange={(e) => setQ({ max: e.target.value })} />
          </label>
          {view !== 'places' && <button className={`chip${beginner ? ' on' : ''}`} onClick={() => setQ({ beg: !beginner && '1' })}>First time welcome</button>}
          {view !== 'places' && <button className={`chip${freeOnly ? ' on' : ''}`} onClick={() => setQ({ free: !freeOnly && '1' })}>Free</button>}
          {view === 'places' && rich.length > 0 && <button className={`chip${openNow ? ' on' : ''}`} onClick={() => setQ({ open: !openNow && '1' })}>Open now</button>}
          {activeFilters > 0 && <button className="chip clear" onClick={() => setQ({ beg: null, free: null, open: null, max: null })}>Clear</button>}
        </div>
      </div>

      {view === 'classes' && (
        seriesList.length === 0
          ? <Empty radius={radius} />
          : <div className="stack" style={{ marginTop: 18 }}>
            {firstTimers.length > 0 && (
              <section>
                <div className="grp"><h2>Start here</h2><span className="small muted">No experience assumed</span></div>
                <div className="grid two">{firstTimers.map(({ s, miles }, i) => <SeriesCard key={s.id} s={s} miles={miles} i={i} />)}</div>
              </section>
            )}
            {rest.length > 0 && (
              <section style={{ marginTop: firstTimers.length ? 14 : 0 }}>
                <div className="grp"><h2>{firstTimers.length ? 'Once you have been a few times' : 'Regular sessions'}</h2></div>
                <div className="grid two">{rest.map(({ s, miles }, i) => <SeriesCard key={s.id} s={s} miles={miles} i={i} />)}</div>
              </section>
            )}
          </div>
      )}

      {view === 'places' && (
        placeList.length === 0
          ? <Empty radius={radius} />
          : <div className="stack" style={{ marginTop: 18 }}>
            <div className="row between">
              {kinds.length > 1 && (
                <div className="chips scroll">
                  <button className={`chip${kind === 'all' ? ' on' : ''}`} onClick={() => setQ({ kind: null })}>All</button>
                  {kinds.map((k) => <button key={k} className={`chip${kind === k ? ' on' : ''}`} onClick={() => setQ({ kind: k })}>{KIND_LABEL[k]} · {places.filter((p) => p.kind === k).length}</button>)}
                </div>
              )}
              <button className="chip" onClick={() => setShowMap(!showMap)}>{showMap ? 'Hide map' : 'Show map'}</button>
            </div>
            {showMap && <VenueMap venues={placeList} tint={hobby.tint} center={here} you={here} zoom={radius > 12 ? 10 : 11} />}
            {placeGroups.map(([k, list]) => (
              <section key={k}>
                {placeGroups.length > 1 && <div className="grp"><h2>{KIND_PLURAL[k] || KIND_LABEL[k]}</h2><span className="small muted">{list.length}</span></div>}
                <div className="grid two">{list.map((p, i) => <PlaceCard key={p.id} p={p} miles={p.miles} i={i} />)}</div>
              </section>
            ))}
          </div>
      )}

      {view === 'calendar' && (
        byDay.length === 0
          ? <Empty radius={radius} />
          : byDay.map((day, di) => (
            <div key={di}>
              <div className="day-h">{fmtRel(day[0].s.start)} <small>{fmtDayLong(day[0].s.start)}</small></div>
              <div className="grid two">
                {day.map(({ s, miles }, i) => <SessionCard key={s.id} s={s} miles={miles} i={i} friends={friendsAt(s, st.following, SEED_OPEN_SEATS)} going={st.going.includes(s.id)} />)}
              </div>
            </div>
          ))
      )}

      {view === 'gear' && (
        <div className="stack" style={{ marginTop: 18 }}>
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

function groupByDay(list) {
  const m = new Map()
  for (const x of list) { const k = dayKey(x.s.start); if (!m.has(k)) m.set(k, []); m.get(k).push(x) }
  return [...m.values()]
}

function Empty({ radius }) {
  return <div className="empty" style={{ marginTop: 20 }}>Nothing within {radius} miles with those filters. Widen the radius or clear a filter.</div>
}
