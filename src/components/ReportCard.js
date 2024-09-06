import { useState } from 'react';
import Popup from './Popup'; // Import the Popup component
import styles from './css/ReportCard.module.css';
import LeafletMap from './LeafletMap'; // Import the LeafletMap component

export default function ReportCard({ address, victimCount, status, tweet, coordinates, phoneNumber, needs, language }) {
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
      seeTweet: 'See Tweet',
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
      <div className={styles.cardHeader}>{address}</div>
      <div className={styles.cardContent}>
        <p>{text[language].estimatedVictims}: {victimCount}</p>
        <p>{text[language].status}: {status}</p>
        
        {/* Display Important Information */}
        <div className={styles.importantInfo}>
          <p><strong>{text[language].importantInfo}:</strong></p>
          <p>{text[language].phoneNumber}: {displayPhoneNumber}</p>
          <p>{text[language].needs}: {displayNeeds}</p>
        </div>
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