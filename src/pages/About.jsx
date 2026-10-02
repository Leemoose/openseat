import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="prose reveal">
      <div className="tiny" style={{ color: 'var(--clay)' }}>How it works</div>
      <h1 style={{ marginTop: 6 }}>Trying a new hobby should take one tap.</h1>
      <p style={{ marginTop: 16 }}>Every hobby in Philadelphia already has a weekly thing: the intro course at the climbing gym, the clay date on a Friday, the open board game night. They're spread across thirty different websites, half of them don't say what a first visit costs, and booking one means working out somebody's scheduling system.</p>
      <p>Kindling puts them in one place. Pick a class, tap <b>Hold my seat</b>, tell us who you are, and we hold a seat for you. Then you just show up.</p>

      <h2>What you'll see here</h2>
      <ul>
        <li>Real venues at real addresses.</li>
        <li>We never show how full a class is, because no venue publishes that.</li>
      </ul>

      <h2>Early beta</h2>
      <p>Kindling is new. Nothing is charged today, and holding a seat starts with a short form. We're using it to find out which classes people want most.</p>
      <p style={{ marginTop: 20 }}><Link to="/" className="btn primary">Find a class</Link></p>
      <p className="small muted" style={{ marginTop: 24 }}>Built as a Wharton class project, Philadelphia, fall 2026.</p>
    </div>
  )
}
