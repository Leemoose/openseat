// Tiny localStorage-backed state. The prototype has no backend; everything a
// visitor does lives in their own browser and is wiped by "Reset demo".
import { useCallback, useEffect, useState } from 'react'

const KEY = 'openseat.v1'
const DEFAULTS = {
  me: { hood: 'fishtown' },
  // Attribution. Nothing else in the product could tell whether a single
  // person went anywhere, which left no evidence to show a venue and no
  // metric for the thing the project says it measures: repeat attendance.
  clicks: [],         // { placeId, sessionId, at } one per click out to a venue
  holds: [],          // { sessionId, price, at } paid-intent taps
}

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return { ...DEFAULTS } }
}
function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
}

const listeners = new Set()
let state = read()

export function useStore() {
  const [s, setS] = useState(state)
  useEffect(() => { listeners.add(setS); return () => listeners.delete(setS) }, [])
  const update = useCallback((patch) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
    write(state)
    listeners.forEach((l) => l(state))
  }, [])
  const reset = useCallback(() => {
    state = { ...DEFAULTS }
    write(state)
    listeners.forEach((l) => l(state))
  }, [])
  return [s, update, reset]
}

// The store outside React. Attribution fires from click handlers on links that
// are navigating away, where a hook is the wrong shape.
export function getState() { return state }
export function updateStore(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  write(state)
  listeners.forEach((l) => l(state))
}

export function toggleIn(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}
