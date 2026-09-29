import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import SearchBox from './components/SearchBox.jsx'
import { pageview } from './lib/track.js'

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('openseat:toast', { detail: msg }))
}

// Four destinations, one per question a visitor actually arrives with:
// "I want to try something", "I have Thursday free", "I want company",
// "what did I save". Pricing and About are prototype scaffolding and live in
// the footer, not in the primary nav.
const LINKS = [
  ['/', 'Explore', 'Explore', '◍'],
  ['/week', "What's on", 'On now', '▤'],
  ['/open', 'Open seats', 'Seats', '▢'],
  ['/me', 'You', 'You', '◉'],
]

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
            {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <Outlet />
        <footer className="foot">
          <span>OpenSeat is a prototype. Nothing here is a booking; every session links to the venue.</span>
          <Link to="/about">What is real and what is sample data</Link>
          <Link to="/pricing">Pricing</Link>
        </footer>
      </main>
      <nav className="bnav">
        {LINKS.map(([to, , short, glyph]) => (
          <NavLink key={to} to={to} end={to === '/'}><span>{glyph}</span>{short}</NavLink>
        ))}
      </nav>
      {msg && <div className="toast">{msg}</div>}
    </>
  )
}
