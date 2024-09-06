import { useState, useEffect } from 'react';
import styles from './css/ReportCard.module.css';
import Popup from './Popup'; // Import the Popup component
import LeafletMap from './LeafletMap'; // Import the LeafletMap component
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode to decode JWT token

export default function ReportCard({ address, victimCount, status, tweet, coordinates, phoneNumber, needs, language, onUpdateStatus }) {
  const [isTweetVisible, setIsTweetVisible] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // State for dropdown visibility
  const [userRole, setUserRole] = useState(null); // State to store user role if logged in

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.roles); // Set the user role from JWT token
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const toggleTweetVisibility = () => {
    setIsTweetVisible(!isTweetVisible);
  };

  const toggleMap = () => {
    setIsMapOpen(!isMapOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(newStatus); // Update backend with the new status
    setIsDropdownVisible(false); // Close the dropdown after status change
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
      changeStatus: 'Durumunu Değiştir',
      changeToVisited: 'Gidildi olarak değiştir',
      changeToFalse: 'Asılsız olarak değiştir',
      changeToHelpNeeded: 'Yardım Bekliyor olarak değiştir',
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
      changeStatus: 'Change Status',
      changeToVisited: 'Mark as Visited',
      changeToFalse: 'Mark as False Report',
      changeToHelpNeeded: 'Mark as Help Needed',
    },
  };

  // This maps the dropdown labels to actual statuses
  const statusMapping = {
    [text[language].changeToVisited]: text[language].visited,
    [text[language].changeToFalse]: text[language].falseReport,
    [text[language].changeToHelpNeeded]: text[language].helpNeeded,
  };

  // Check if phoneNumber or needs are empty, "N/A", or "yok", and display the fallback message
  const displayPhoneNumber = phoneNumber && phoneNumber.toLowerCase() !== 'n/a' && phoneNumber.toLowerCase() !== 'yok' ? phoneNumber : text[language].noInfo;
  const displayNeeds = needs && needs.toLowerCase() !== 'n/a' && needs.toLowerCase() !== 'yok' ? needs : text[language].noInfo;

  const statusOptions = {
    [text[language].helpNeeded]: [
      { label: text[language].changeToVisited, className: styles.visitedButton },
      { label: text[language].changeToFalse, className: styles.falseReportButton },
    ],
    [text[language].visited]: [
      { label: text[language].changeToFalse, className: styles.falseReportButton },
      { label: text[language].changeToHelpNeeded, className: styles.helpNeededButton },
    ],
    [text[language].falseReport]: [
      { label: text[language].changeToVisited, className: styles.visitedButton },
      { label: text[language].changeToHelpNeeded, className: styles.helpNeededButton },
    ],
  };

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

      {/* Dropdown slider for logged-in users with roles */}
      {userRole && (
        <div className={styles.statusDropdown}>
          <button onClick={toggleDropdown} className={styles.buttonStatus}>
            {text[language].changeStatus}
          </button>
          {isDropdownVisible && (
            <div className={styles.dropdownContent}>
              {statusOptions[status].map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleStatusChange(statusMapping[option.label])} // Send actual status, not label
                  className={option.className}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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