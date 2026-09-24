import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

// OSM tiles are fine at prototype scale; swap the provider before real traffic.
export default function VenueMap({ venues, center, tint = '#c8552f', zoom = 12, you, onPick }) {
  const c = center || { lat: 39.9626, lng: -75.15 }
  return (
    <div className="map">
      <MapContainer center={[c.lat, c.lng]} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {you && <CircleMarker center={[you.lat, you.lng]} radius={7} pathOptions={{ color: '#1e1a16', fillColor: '#1e1a16', fillOpacity: 1 }}><Tooltip>You (approx.)</Tooltip></CircleMarker>}
        {venues.filter((v) => v.lat != null).map((v) => (
          <CircleMarker key={v.id} center={[v.lat, v.lng]} radius={9} pathOptions={{ color: '#1e1a16', weight: 1.5, fillColor: tint, fillOpacity: .9 }} eventHandlers={onPick ? { click: () => onPick(v) } : undefined}>
            <Tooltip>{v.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
