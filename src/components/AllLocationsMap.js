import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import api from './axiosconfig/Api';
import styles from './css/AllLocationsMap.module.css';

export default function AllLocationsMap() {
  const [groupedLocations, setGroupedLocations] = useState([]);
  const navigate = useNavigate();

  const groupLocationsByCoordinates = (reports) => {
    const locationMap = {};
    reports.forEach((report) => {
      const lat = parseFloat(report.coordinates.latitude);
      const lon = parseFloat(report.coordinates.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const key = `${lat},${lon}`;
        if (!locationMap[key]) {
          locationMap[key] = { count: 0, reports: [] };
        }
        locationMap[key].count += 1;
        locationMap[key].reports.push(report);
      }
    });
    return Object.entries(locationMap).map(([coordinates, data]) => {
      const [lat, lon] = coordinates.split(',');
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        count: data.count,
        reports: data.reports,
      };
    });
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/reports');
      const reports = response.data;
      const validLocations = reports.filter(
        (report) =>
          report.coordinates.latitude !== 'N/A' &&
          report.coordinates.longitude !== 'N/A'
      );
      const grouped = groupLocationsByCoordinates(validLocations);
      setGroupedLocations(grouped);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const defaultCenter = [39.9334, 32.8597];

  const createCustomMarkerIcon = (reportCount) => {
    return L.divIcon({
      className: styles.customMarker,
      html: `<div class="${styles.markerIcon}">${reportCount || 0}</div>`,
      iconSize: [30, 30],
    });
  };

  return (
    <div className={styles.mapContainer}>
      <button onClick={() => navigate('/')} className={styles.backButton}>
        Ana Sayfaya Dön
      </button>

      <MapContainer center={defaultCenter} zoom={6} className={styles.map}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {groupedLocations.map((location) => (
          <Marker
            key={`${location.lat}-${location.lon}`}
            position={[location.lat, location.lon]}
            icon={createCustomMarkerIcon(location.count)}
          >
<Popup className={styles.popupContainer}>
  {location.reports.map((report, index) => (
    <div key={index} className={styles.popupReport}>
      <div className={styles.popupAddress}>
        {report.locationHierarchy}
      </div>
      <div className={styles.popupDetails}>
        <span>Tahmini mağdur sayısı:</span> {report.victimCount || 'Bilinmiyor'}
        <br />
        <span>Durum:</span> {report.status}
      </div>
    </div>
  ))}
</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}