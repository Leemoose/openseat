// Tiny localStorage-backed state. The prototype has no backend; everything a
// visitor does lives in their own browser and is wiped by "Reset demo".
import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_FOLLOWING } from '../data/people.js'

const KEY = 'openseat.v1'
const DEFAULTS = {
  me: { name: 'You', hood: 'fishtown', hobbies: ['pottery', 'guitar'], blurb: 'New here. Trying things.' },
  following: DEFAULT_FOLLOWING,
  going: [],          // session ids
  myOpenSeats: [],    // { id, sessionId, seats, say, createdAt }
  requested: [],      // open-seat ids the user asked to join
  hidden: [],         // seed open-seat ids dismissed
  wtp: null,          // willingness-to-pay answer from the pricing page
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

export function toggleIn(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}
