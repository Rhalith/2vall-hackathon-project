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
  const [language, setLanguage] = useState('TR');
  const [copiedReportId, setCopiedReportId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();

  const groupLocationsByCoordinates = (reports) => {
    const locationMap = {};
    reports.forEach((report) => {
      const lat = parseFloat(report.coordinates?.lat);
      const lon = parseFloat(report.coordinates?.lng);
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

  const loadFromCache = async () => {
    const cached = localStorage.getItem('cachedReports');
    const cachedTimestamp = localStorage.getItem('cachedReportsTimestamp');
    if (!cached) return false;

    try {
      const parsed = JSON.parse(cached);
      const validLocations = parsed.filter(
        (report) => report.coordinates?.lat !== 'N/A' && report.coordinates?.lng !== 'N/A'
      );
      const grouped = groupLocationsByCoordinates(validLocations);
      setGroupedLocations(grouped);
      if (cachedTimestamp) {
        setLastUpdated(new Date(cachedTimestamp));
      }
      return true;
    } catch (e) {
      console.warn('Invalid cachedReports format:', e);
      return false;
    }
  };

  const refreshFromAPI = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/api/reports');
      const reports = response.data;

      const parsedReports = reports.map((report) => {
        const parts = report.a?.split(' ') || [];
        return {
          id: report._id?.$oid || '',
          address: report.a,
          tweet: report.t,
          coordinates: report.c,
          contact: report.ct,
          victimCount: report.v,
          status: report.s,
          isDroneValidated: report.d,
          region: parts[0] || '',
          district: parts[1] || '',
          neighborhood: parts[2] || '',
          locationHierarchy: `${parts[0] || ''}${parts[1] ? `, ${parts[1]}` : ''}${parts[2] ? `, ${parts[2]}` : ''}`,
        };
      });

      const validLocations = parsedReports.filter(
        (report) => report.coordinates?.lat !== 'N/A' && report.coordinates?.lng !== 'N/A'
      );

      const grouped = groupLocationsByCoordinates(validLocations);
      setGroupedLocations(grouped);
      setLastUpdated(new Date());

      localStorage.setItem('cachedReports', JSON.stringify(parsedReports));
      localStorage.setItem('cachedReportsTimestamp', new Date().toISOString());
    } catch (err) {
      console.error('Error fetching locations from API:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadFromCache();
      await refreshFromAPI();
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromAPI();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const defaultCenter = [39.9334, 32.8597];

  const createCustomMarkerIcon = (reportCount) => {
    return L.divIcon({
      className: styles.customMarker,
      html: `<div class="${styles.markerIcon}">${reportCount || 0}</div>`,
      iconSize: [30, 30],
    });
  };

  const copyToClipboard = (text, reportId) => {
    navigator.clipboard.writeText(text);
    setCopiedReportId(reportId);
    setTimeout(() => setCopiedReportId(null), 2000);
  };

  const text = {
    TR: {
      backButton: 'Ana Sayfaya Dön',
      copy: 'Kopyala',
      copied: 'Kopyalandı',
      victimCount: 'Tahmini mağdur sayısı',
      status: 'Durum',
      switchLang: 'EN',
      helpNeeded: 'Yardım Bekliyor',
      visited: 'Gidildi',
      falseReport: 'Asılsız',
      lastUpdated: 'Son güncelleme',
      updating: 'Veriler güncelleniyor...',
    },
    EN: {
      backButton: 'Go Back to Homepage',
      copy: 'Copy',
      copied: 'Copied',
      victimCount: 'Estimated Victim Count',
      status: 'Status',
      switchLang: 'TR',
      helpNeeded: 'Help Needed',
      visited: 'Visited',
      falseReport: 'False Report',
      lastUpdated: 'Last updated',
      updating: 'Refreshing data...',
    },
  };

  const statusTranslation = {
    'Yardım Bekliyor': text[language].helpNeeded,
    'Gidildi': text[language].visited,
    'Asılsız': text[language].falseReport,
  };

  const translateStatus = (status) => {
    return statusTranslation[status] || status;
  };

  return (
    <div className={styles.mapContainer}>
      <button onClick={() => setLanguage((prev) => (prev === 'TR' ? 'EN' : 'TR'))} className={styles.langButton}>
        {text[language].switchLang}
      </button>

      <button onClick={() => navigate('/')} className={styles.backButton}>
        {text[language].backButton}
      </button>

      {lastUpdated && (
        <p className={styles.lastUpdated}>
          {text[language].lastUpdated}: {lastUpdated.toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US')}
        </p>
      )}

      {isRefreshing && (
        <p className={styles.updatingMessage}>
          {text[language].updating}
        </p>
      )}

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
                    <button
                      onClick={() => copyToClipboard(report.locationHierarchy, report.id)}
                      className={styles.copyButton}
                    >
                      {copiedReportId === report.id ? text[language].copied : text[language].copy}
                    </button>
                  </div>
                  <div className={styles.popupDetails}>
                    <span>{text[language].victimCount}:</span> {report.victimCount || 'Bilinmiyor'}
                    <br />
                    <span>{text[language].status}:</span> {translateStatus(report.status)}
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
