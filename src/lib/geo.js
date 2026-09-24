export const HOODS = [
  { id: 'fishtown', name: 'Fishtown', lat: 39.9712, lng: -75.1338 },
  { id: 'nolibs', name: 'Northern Liberties', lat: 39.9640, lng: -75.1420 },
  { id: 'oldcity', name: 'Old City', lat: 39.9520, lng: -75.1440 },
  { id: 'rittenhouse', name: 'Rittenhouse', lat: 39.9496, lng: -75.1720 },
  { id: 'queenvillage', name: 'Queen Village', lat: 39.9395, lng: -75.1500 },
  { id: 'southphilly', name: 'South Philly', lat: 39.9270, lng: -75.1650 },
  { id: 'fairmount', name: 'Fairmount', lat: 39.9680, lng: -75.1720 },
  { id: 'ucity', name: 'University City', lat: 39.9540, lng: -75.1930 },
  { id: 'manayunk', name: 'Manayunk', lat: 40.0270, lng: -75.2230 },
  { id: 'wyncote', name: 'Wyncote / Glenside', lat: 40.0940, lng: -75.1500 },
]

export function milesBetween(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null
  const R = 3958.8
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtMiles(m) {
  if (m == null) return ''
  return m < 0.95 ? `${(m).toFixed(1)} mi` : `${Math.round(m)} mi`
}
