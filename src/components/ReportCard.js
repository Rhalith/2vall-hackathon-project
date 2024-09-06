import { useState } from 'react';
import styles from './css/ReportCard.module.css';
import Popup from './Popup'; // Import the Popup component
import LeafletMap from './LeafletMap'; // Import the LeafletMap component

export default function ReportCard({ address, victimCount, status, tweet, coordinates, phoneNumber, needs, language }) {
  const [isTweetVisible, setIsTweetVisible] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const toggleTweetVisibility = () => {
    setIsTweetVisible(!isTweetVisible);
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
      showTweet: 'Tweeti göster',
      hideTweet: 'Tweeti gizle',
      seeLocation: 'Konumu Gör',
      noTweet: 'Tweet bulunamadı!',
      importantInfo: 'Önemli Bilgiler',
      phoneNumber: 'Telefon Numarası',
      needs: 'İhtiyaç Listesi',
      noInfo: 'Bilgi bulunamadı!',
    },
    EN: {
      estimatedVictims: 'Estimated Victim Count',
      status: 'Status',
      helpNeeded: 'Help Needed',
      visited: 'Visited',
      falseReport: 'False Report',
      showTweet: 'Show Tweet',
      hideTweet: 'Hide Tweet',
      seeLocation: 'See Location',
      noTweet: 'Tweet not found!',
      importantInfo: 'Important Information',
      phoneNumber: 'Phone Number',
      needs: 'Needs List',
      noInfo: 'No information found!',
    },
  };

  // Check if phoneNumber or needs are empty, "N/A", or "yok", and display the fallback message
  const displayPhoneNumber = phoneNumber && phoneNumber.toLowerCase() !== 'n/a' && phoneNumber.toLowerCase() !== 'yok' ? phoneNumber : text[language].noInfo;
  const displayNeeds = needs && needs.toLowerCase() !== 'n/a' && needs.toLowerCase() !== 'yok' ? needs : text[language].noInfo;

  return (
    <div className={styles.card}>
      <div className={styles.address}>{address}</div>
      <div className={styles.victimCount}>{text[language].estimatedVictims}: {victimCount}</div>
      <div className={`${styles.status} ${status === text[language].helpNeeded ? styles.statusWaiting : status === text[language].visited ? styles.statusVisited : styles.statusFalse}`}>
        {status}
      </div>

      {/* Display Important Information */}
      <div className={styles.importantInfo}>
        <p><strong>{text[language].importantInfo}:</strong></p>
        <p>{text[language].phoneNumber}: {displayPhoneNumber}</p>
        <p>{text[language].needs}: {displayNeeds}</p>
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={styles.buttonTweet} 
          onClick={toggleTweetVisibility}
        >
          {isTweetVisible ? text[language].hideTweet : text[language].showTweet}
        </button>

        <button 
          className={styles.buttonMap} 
          onClick={toggleMap}
        >
          {text[language].seeLocation}
        </button>
      </div>

      {/* Dropdown slider for showing the tweet */}
      <div className={`${styles.tweetContainer} ${isTweetVisible ? styles.visible : ''}`}>
        <p>{tweet ? tweet : text[language].noTweet}</p>
      </div>

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