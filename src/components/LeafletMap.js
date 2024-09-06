import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-defaulticon-compatibility'; // Fix for marker icons
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'; // CSS for default icons

// Component to handle setting the map view
function UpdateMapCenter({ coordinates }) {
  const map = useMap(); // Access the map instance

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, 13); // Set the map view to the new coordinates with zoom level 13
    }
  }, [coordinates, map]);

  return null;
}

export default function LeafletMap({ address }) {
  const [coordinates, setCoordinates] = useState([39.9334, 32.8597]); // Default to Ankara coordinates
  const [isLocationFound, setIsLocationFound] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Escape key to prevent map errors
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        event.preventDefault(); // Prevent default behavior when Esc is pressed
      }
    };

    window.addEventListener("keydown", handleEsc);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Geocode the address using OpenStreetMap's Nominatim API
  useEffect(() => {
    const geocodeAddress = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          setCoordinates([parseFloat(lat), parseFloat(lon)]);
          setIsLocationFound(true);
          setErrorMessage('');
        } else {
          setIsLocationFound(false);
          setErrorMessage('Adres bulunamadı!');
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        setIsLocationFound(false);
        setErrorMessage('Geocode işlemi sırasında bir hata oluştu.');
      }
    };
    geocodeAddress();
  }, [address]);

  // Function to open Google Maps with the search query
  const openGoogleMapsSearch = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank'); // Opens Google Maps in a new tab
  };

  return (
    <div>
      {/* Map display */}
      <MapContainer center={coordinates} zoom={13} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <UpdateMapCenter coordinates={coordinates} /> {/* Update map center when coordinates change */}
        {isLocationFound ? (
          <Marker position={coordinates}>
            <Popup>{address}</Popup>
          </Marker>
        ) : (
          <p>{errorMessage}</p>
        )}
      </MapContainer>

      {/* Button to search in Google Maps */}
      <button onClick={openGoogleMapsSearch} style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>
        Google Maps'te ara
      </button>
    </div>
  );
}