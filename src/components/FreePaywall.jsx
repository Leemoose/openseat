import { useEffect } from 'react'
import { SUB_PRICE } from '../lib/track.js'
import { subscribeLink, recordPaywallView, recordPaywallClick } from '../lib/intent.js'
import { toast } from '../App.jsx'

// The subscription arm's prompt for free classes. Shown from a hobby's Free
// tab, and in place of a free class's page if someone lands on one by link.
export function FreePaywallBody({ hobby, count, onClose }) {
  useEffect(() => { recordPaywallView(hobby.id, count) }, [hobby.id, count])
  return (
    <>
      <h3>Free classes are for members</h3>
      <p className="small muted" style={{ marginTop: 8 }}>
        {count > 0
          ? <>There {count === 1 ? 'is 1 free class' : `are ${count} free classes`} in {hobby.name.toLowerCase()} near Philadelphia right now.</>
          : <>Free {hobby.name.toLowerCase()} classes come up regularly near Philadelphia.</>}
        {' '}Subscribe to Kindling to see them and book a seat. Free classes cost nothing at the venue.
      </p>
      <div className="amt" style={{ margin: '16px 0 4px' }}>${SUB_PRICE}<small>/month</small></div>
      <p className="tiny muted">Book seats at any class on Kindling. Cancel any time.</p>
      <div className="row" style={{ marginTop: 16, gap: 8 }}>
        <a
          className="btn primary"
          href={subscribeLink(hobby.name)}
          target="_blank"
          rel="noreferrer"
          onClick={() => { recordPaywallClick(hobby.id, count); toast('Thank you. Tell us who you are and we will confirm.') }}
        >Subscribe for ${SUB_PRICE}/mo ↗</a>
        {onClose && <button className="btn ghost" onClick={onClose}>Not now</button>}
      </div>
    </>
  )
}

export default function FreePaywall({ hobby, count, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="card hold modal" role="dialog" aria-modal="true" aria-label="Subscribe to see free classes" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        <FreePaywallBody hobby={hobby} count={count} onClose={onClose} />
      </div>
    </div>
  )
}
