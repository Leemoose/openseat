// The social layer's cast. These six are invented, and they are marked `demo`
// so every surface that shows a face can say so. The network is the retention
// mechanism and stays in full; what cannot stay is a fabricated person wearing
// the same styling as a verified venue on a site whose argument is that its
// data is honestly sourced. Replace one with a real person and drop the flag.
export const PEOPLE = [
  { id: 'maya', name: 'Maya R.', hood: 'Fishtown', hobbies: ['pottery', 'climbing'], blurb: 'Threw my first bowl in March, still lopsided. Happy to belay if you can belay me back.', tint: '#c8552f', demo: true },
  { id: 'dev', name: 'Dev P.', hood: 'Queen Village', hobbies: ['boardgames', 'guitar'], blurb: 'Owns too many two-player games. Learning fingerstyle badly.', tint: '#2f4f8f', demo: true },
  { id: 'jules', name: 'Jules K.', hood: 'Rittenhouse', hobbies: ['guitar', 'art'], blurb: 'Ten years of playing alone in an apartment. Trying to fix that.', tint: '#8a5a1f', demo: true },
  { id: 'sam', name: 'Sam O.', hood: 'Northern Liberties', hobbies: ['climbing', 'cycling'], blurb: 'V3 on a good day. Slow on a bike, fast at coffee after.', tint: '#3f6b4a', demo: true },
  { id: 'tess', name: 'Tess M.', hood: 'South Philly', hobbies: ['pottery', 'art'], blurb: 'Handbuilding only, the wheel and I are not on speaking terms.', tint: '#7a3e6b', demo: true },
  { id: 'arjun', name: 'Arjun S.', hood: 'University City', hobbies: ['boardgames', 'golf'], blurb: 'Will teach any game under 45 minutes. Slices right.', tint: '#4a6b2f', demo: true },
]

export const personById = (id) => PEOPLE.find((p) => p.id === id)

// Who the demo user follows by default.
export const DEFAULT_FOLLOWING = ['maya', 'dev', 'jules']
