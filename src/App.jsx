import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('openseat:toast', { detail: msg }))
}

export default function App() {
  const [msg, setMsg] = useState(null)
  const loc = useLocation()

  useEffect(() => {
    let t
    const on = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(null), 2400) }
    window.addEventListener('openseat:toast', on)
    return () => { window.removeEventListener('openseat:toast', on); clearTimeout(t) }
  }, [])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])

  const links = [
    ['/', 'Explore', 'Explore'],
    ['/open', 'Open seats', 'Seats'],
    ['/me', 'You', 'You'],
    ['/pricing', 'Pricing', 'Pricing'],
  ]

  return (
    <>
      <header className="hdr">
        <div className="wrap">
          <Link to="/" className="logo"><i /> <span>Open<b>Seat</b></span><span className="tag">Philly beta</span></Link>
          <nav className="nav">
            {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <Outlet />
        <footer className="foot">
          <span>OpenSeat is a prototype. Nothing here is a booking; every session links to the venue.</span>
          <Link to="/about">What is real and what is sample data</Link>
        </footer>
      </main>
      <nav className="bnav">
        {links.map(([to, , short]) => <NavLink key={to} to={to} end={to === '/'}><span>{short === 'Explore' ? '◍' : short === 'Seats' ? '▢' : short === 'You' ? '◉' : '$'}</span>{short}</NavLink>)}
      </nav>
      {msg && <div className="toast">{msg}</div>}
    </>
  )
}
