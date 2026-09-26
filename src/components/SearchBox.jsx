import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { search, TYPE_LABEL } from '../lib/search.js'

export default function SearchBox({ big, placeholder = 'Try pottery, Fishtown, YAY!Clay' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  const box = useRef(null)
  const nav = useNavigate()
  const hits = open ? search(q, big ? 8 : 6) : []

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])

  // "/" focuses search from anywhere, the convention on every browse-heavy site.
  useEffect(() => {
    if (!big) return
    const key = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const t = e.target.tagName
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return
      e.preventDefault()
      box.current?.querySelector('input')?.focus()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [big])

  function go(hit) {
    if (!hit) return
    setOpen(false); setQ('')
    nav(hit.to)
  }

  function onKey(e) {
    if (!hits.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % hits.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + hits.length) % hits.length) }
    if (e.key === 'Enter') { e.preventDefault(); go(hits[Math.min(sel, hits.length - 1)]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className={`search${big ? ' big' : ''}`} ref={box}>
      <span className="ic" aria-hidden>⌕</span>
      <input
        type="search" value={q} placeholder={placeholder} aria-label="Search hobbies, places and classes"
        onChange={(e) => { setQ(e.target.value); setOpen(true); setSel(0) }}
        onFocus={() => setOpen(true)} onKeyDown={onKey}
      />
      {open && q.trim().length >= 2 && (
        <div className="results">
          {hits.length === 0
            ? <div className="none">Nothing matches "{q.trim()}".</div>
            : hits.map((h, i) => (
              <button key={`${h.type}-${h.id}`} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => go(h)}>
                <span className="t" style={h.tint ? { color: h.tint } : undefined}>{TYPE_LABEL[h.type]}</span>
                <span className="l">{h.label}</span>
                <span className="s">{h.sub}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
