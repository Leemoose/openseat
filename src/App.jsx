import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import SearchBox from './components/SearchBox.jsx'
import { pageview } from './lib/track.js'

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('openseat:toast', { detail: msg }))
}

// The MVP has one job: count how many people ask for a seat. So there is one
// path (hobby, class, hold my seat) and nothing in the nav that leads off it.
export default function App() {
  const [msg, setMsg] = useState(null)
  const loc = useLocation()

  useEffect(() => {
    let t
    const on = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(null), 2400) }
    window.addEventListener('openseat:toast', on)
    return () => { window.removeEventListener('openseat:toast', on); clearTimeout(t) }
  }, [])

  // One pageview per route, which is the funnel's top: landed, opened a
  // hobby, opened a session, tapped hold.
  useEffect(() => { window.scrollTo({ top: 0 }); pageview(loc.pathname) }, [loc.pathname])

  return (
    <>
      <header className="hdr">
        <div className="wrap">
          <Link to="/" className="logo"><i /> <span>Open<b>Seat</b></span><span className="tag">Philly beta</span></Link>
          <SearchBox big />
          <nav className="nav">
            <NavLink to="/about">How it works</NavLink>
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <Outlet />
        <footer className="foot">
          <span>OpenSeat is in early beta in Philadelphia.</span>
          <Link to="/about">How it works</Link>
        </footer>
      </main>
      {msg && <div className="toast">{msg}</div>}
    </>
  )
}
