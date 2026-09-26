import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HOBBIES } from '../data/hobbies.js'
import { SEED_OPEN_SEATS } from '../data/openseats.js'
import { sessionById } from '../data/sessions.js'
import { useStore, toggleIn } from '../lib/store.js'
import OpenSeatCard from '../components/OpenSeatCard.jsx'
import { toast } from '../App.jsx'

export default function OpenSeats() {
  const [st, update] = useStore()
  const [hobby, setHobby] = useState('all')
  const [friendsOnly, setFriendsOnly] = useState(false)

  const all = [...st.myOpenSeats, ...SEED_OPEN_SEATS.filter((o) => !st.hidden.includes(o.id))]
    .filter((o) => sessionById(o.sessionId))
    .filter((o) => hobby === 'all' || sessionById(o.sessionId).hobby === hobby)
    .filter((o) => !friendsOnly || !o.personId || st.following.includes(o.personId))
    .sort((a, b) => sessionById(a.sessionId).start - sessionById(b.sessionId).start)

  return (
    <>
      <div className="reveal">
        <div className="kicker tiny" style={{ color: 'var(--clay)' }}>Philadelphia</div>
        <h1 style={{ marginTop: 6 }}>Open seats</h1>
        <p className="muted" style={{ marginTop: 10, maxWidth: '52ch' }}>People already going to a session who have room for one more. Ask to join, they see your profile, you both show up. Post your own from any session page.</p>
      </div>
      <div className="controls">
        <div className="chips scroll">
          <button className={`chip${hobby === 'all' ? ' on' : ''}`} onClick={() => setHobby('all')}>All</button>
          {HOBBIES.map((h) => <button key={h.id} className={`chip${hobby === h.id ? ' on' : ''}`} onClick={() => setHobby(h.id)}>{h.name}</button>)}
        </div>
        <button className={`chip${friendsOnly ? ' on' : ''}`} onClick={() => setFriendsOnly(!friendsOnly)}>People I follow</button>
      </div>
      {all.length === 0
        ? <div className="empty" style={{ marginTop: 20 }}>No open seats here yet. <Link to="/">Find a session</Link> and open one.</div>
        : <div className="grid three" style={{ marginTop: 16 }}>
          {all.map((o, i) => (
            <OpenSeatCard key={o.id} o={o} i={i} me={st.me} requested={st.requested.includes(o.id)}
              onRequest={(id) => { update({ requested: toggleIn(st.requested, id) }); toast(st.requested.includes(id) ? 'Request withdrawn' : 'Asked. They get a note with your profile.') }}
              onRemove={(id) => update({ myOpenSeats: st.myOpenSeats.filter((x) => x.id !== id) })} />
          ))}
        </div>}
    </>
  )
}
