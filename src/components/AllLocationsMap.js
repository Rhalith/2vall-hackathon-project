import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-defaulticon-compatibility'; // Fix for marker icons
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'; // CSS for default icons
import api from './axiosconfig/Api'; // Import the API config to fetch reports

export default function AllLocationsMap() {
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate(); // Initialize navigate hook

  // Fetch all report locations
  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/reports');
      const reports = response.data;

      // Filter reports with valid coordinates
      const validLocations = reports.filter(
        (report) =>
          report.coordinates.latitude !== 'N/A' &&
          report.coordinates.longitude !== 'N/A'
      );

      setLocations(validLocations); // Set the filtered reports with valid locations
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchLocations(); // Fetch report locations when the component mounts
  }, []);

  // Default center for the map
  const defaultCenter = [39.9334, 32.8597]; // Default to Ankara coordinates

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Tüm kazazede konumları</h1>
      
      {/* Button to navigate back to the home page */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/')} // Navigate back to the home page
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Ana Sayfaya Dön
        </button>
      </div>

      <MapContainer center={defaultCenter} zoom={6} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Loop through locations and place markers */}
        {locations.map((location) => {
          const lat = parseFloat(location.coordinates.latitude);
          const lon = parseFloat(location.coordinates.longitude);

          // Ensure coordinates are valid before placing the marker
          if (!isNaN(lat) && !isNaN(lon)) {
            return (
              <Marker key={location.id} position={[lat, lon]}>
                <Popup>
                  <strong>{location.address}</strong>
                  <br />
                  Tahmini mağdur sayısı: {location.victimCount || 'Bilinmiyor'}
                  <br />
                  Durum: {location.status}
                </Popup>
              </Marker>
            );
          }

          return null;
        })}
      </MapContainer>
    </div>
  );
}