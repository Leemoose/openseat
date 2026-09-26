// Seed "open seat" posts. Each attaches to the next occurrence of a recurring
// session by venue + title, so they stay valid as the calendar rolls forward.
import { SESSIONS } from './sessions.js'

const SEEDS = [
  { person: 'maya', venueId: 'yayclay', title: 'Clay Date, Retro Room (evening)', seats: 1, say: 'Booked a wheel for two and my friend bailed. Come make a lopsided mug with me.' },
  { person: 'sam', venueId: 'prg-fishtown', title: 'Introduction to Top Rope', seats: 2, say: 'Doing the intro course so I can stop bouldering only. Two spots, beginners ideal, I will not judge your shoes.' },
  { person: 'dev', venueId: 'philly-game-shop', title: 'Open board game night', seats: 3, say: 'Bringing Cascadia and Ra. Teaching both. Three chairs at my table.' },
  { person: 'jules', venueId: 'russo', title: 'Adult beginner guitar (group)', seats: 1, say: 'Signed up for the group class and would love one familiar face there. Zero ability required.' },
  { person: 'arjun', venueId: 'redcaps', title: 'D&D Adventurers League', seats: 2, say: 'Our table lost two players to grad school. Level 3 characters, we have pregens.' },
  { person: 'tess', venueId: 'pottery-gym', title: 'Handbuilding open table', seats: 2, say: 'Sunday handbuilding, then the bakery next door. Bring nothing.' },
  // Anchored to a title that really appears on PRG's calendar, so the seed
  // seats survive the feed replacing the hand-entered climbing sessions.
  { person: 'maya', venueId: 'prg-fishtown', title: 'Fishtown Beta Nights', seats: 1, say: 'Second time at bouldering, want a buddy who is also new.' },
  { person: 'dev', venueId: 'classical-guitar-store', title: 'Classical Guitar Society open play', seats: 2, say: 'Going to listen mostly. Join if you want a low-key Sunday.' },
]

function nextSession(venueId, title) {
  return SESSIONS.find((s) => s.venueId === venueId && s.title === title)
}

export const SEED_OPEN_SEATS = SEEDS.map((o, i) => {
  const s = nextSession(o.venueId, o.title)
  return s ? { id: `seed-${i}`, personId: o.person, sessionId: s.id, seats: o.seats, say: o.say, seed: true } : null
}).filter(Boolean)
