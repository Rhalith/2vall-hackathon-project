import { useState } from 'react';
import Popup from './Popup'; // Import the Popup component
import styles from './css/ReportCard.module.css';
import LeafletMap from './LeafletMap'; // Import the LeafletMap component

export default function ReportCard({ address, victimCount, status, tweet, coordinates, language }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleMap = () => {
    setIsMapOpen(!isMapOpen);
  };

  // Define text for different languages
  const text = {
    TR: {
      estimatedVictims: 'Tahmini mağdur sayısı',
      status: 'Durum',
      helpNeeded: 'Yardım Bekliyor',
      visited: 'Gidildi',
      falseReport: 'Asılsız',
      seeTweet: 'Tweeti Gör',
      seeLocation: 'Konumu Gör',
      noTweet: 'Tweet bulunamadı!',
    },
    EN: {
      estimatedVictims: 'Estimated Victim Count',
      status: 'Status',
      helpNeeded: 'Help Needed',
      visited: 'Visited',
      falseReport: 'False Report',
      seeTweet: 'See Tweet',
      seeLocation: 'See Location',
      noTweet: 'Tweet not found!',
    },
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>{address}</div>
      <div className={styles.cardContent}>
        <p>{text[language].estimatedVictims}: {victimCount}</p>
        <p>{text[language].status}: {status}</p>
      </div>
      <div className={styles.cardFooter}>
        <button 
          className={`${styles.button} ${styles.buttonSuccess}`} 
          disabled={status === text[language].visited}
        >
          {text[language].visited}
        </button>
        <button 
          className={`${styles.button} ${styles.buttonDanger}`} 
          disabled={status === text[language].falseReport}
        >
          {text[language].falseReport}
        </button>
        <button 
          className={`${styles.button} ${styles.buttonTweet}`} 
          onClick={togglePopup}
        >
          {text[language].seeTweet}
        </button>
        <button 
          className={`${styles.button} ${styles.buttonMap}`} 
          onClick={toggleMap}
        >
          {text[language].seeLocation}
        </button>
      </div>

      {/* Popup for the Tweet */}
      {isPopupOpen && (
        <Popup 
          content={tweet ? <p>{tweet}</p> : <p>{text[language].noTweet}</p>} 
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