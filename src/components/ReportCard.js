import { useState } from 'react';
import Popup from './Popup'; // Import the reusable Popup component
import styles from './css/ReportCard.module.css';

export default function ReportCard({ address, victimCount, status, tweet }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
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
      </div>

      {/* Render the Popup component when isPopupOpen is true */}
      {isPopupOpen && (
        <Popup 
          content={tweet ? <p>{tweet}</p> : <p>Tweet bulunamadı!</p>} 
          onClose={togglePopup} 
        />
      )}
    </div>
  );
}