import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-defaulticon-compatibility'; // Fix for marker icons
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'; // CSS for default icons

// Component to handle setting the map view
function UpdateMapCenter({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, 13); // Set map view to the new coordinates
    }
  }, [coordinates, map]);

  return null;
}

export default function LeafletMap({ coordinates, address }) {
  if (!coordinates || coordinates.length !== 2 || coordinates[0] === "N/A" || coordinates[1] === "N/A") {
    return <p>Coordinates not available for this location</p>;
  }

  const lat = parseFloat(coordinates[0]);
  const lon = parseFloat(coordinates[1]);

  if (isNaN(lat) || isNaN(lon)) {
    return <p>Invalid coordinates for this location</p>;
  }

  return (
    <MapContainer center={[lat, lon]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <UpdateMapCenter coordinates={[lat, lon]} />
      <Marker position={[lat, lon]}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
}