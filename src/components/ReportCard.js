import { useState } from 'react';
import Popup from './Popup'; // Import the Popup component
import styles from './css/ReportCard.module.css';
import LeafletMap from './LeafletMap'; // Import the LeafletMap component

export default function ReportCard({ address, victimCount, status, tweet, coordinates }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleMap = () => {
    setIsMapOpen(!isMapOpen);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>{address}</div>
      <div className={styles.cardContent}>
        <p>Tahmini mağdur sayısı: {victimCount}</p>
        <p>Durum: {status}</p>
      </div>
      <div className={styles.cardFooter}>
        <button className={`${styles.button} ${styles.buttonSuccess}`} disabled={status === 'Gidildi'}>
          Gidildi
        </button>
        <button className={`${styles.button} ${styles.buttonDanger}`} disabled={status === 'Asılsız'}>
          Asılsız
        </button>
        <button className={`${styles.button} ${styles.buttonTweet}`} onClick={togglePopup}>
          Tweeti Gör
        </button>
        <button className={`${styles.button} ${styles.buttonMap}`} onClick={toggleMap}>
          Konumu Gör
        </button>
      </div>

      {/* Popup for the Tweet */}
      {isPopupOpen && (
        <Popup 
          content={tweet ? <p>{tweet}</p> : <p>Tweet bulunamadı!</p>} 
          onClose={togglePopup} 
        />
      )}

      {/* Popup for the Leaflet Map */}
      {isMapOpen && (
        <Popup
          content={<LeafletMap coordinates={coordinates} address={address} />} // Pass coordinates and address to LeafletMap
          onClose={toggleMap}
        />
      )}
    </div>
  );
}