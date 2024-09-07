import { useState, useEffect } from 'react';
import axios from './axiosconfig/Api';
import styles from './css/FeedbackPopup.module.css';

export default function FeedbackPopup({ tweet, address, onClose, onSubmit, language }) {
  const [rating, setRating] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [preferredResponse, setPreferredResponse] = useState(''); // New preferred response field
  const [device, setDevice] = useState('unknown'); // State to store the device type
  const [errorMessage, setErrorMessage] = useState('');

  // Text based on language settings
  const text = {
    EN: {
      feedbackOnTweet: 'Feedback on Tweet',
      writeFeedback: 'Write your feedback here...',
      feedbackNote: 'Feedback Note',
      preferredResponse: 'Preferred Response',
      like: 'Like',
      dislike: 'Dislike',
      submit: 'Submit',
      close: 'Close',
      provideFeedback: 'Please provide feedback and a rating.'
    },
    TR: {
      feedbackOnTweet: 'Tweet Hakkında Geri Bildirim',
      writeFeedback: 'Geri bildiriminizi buraya yazın...',
      feedbackNote: 'Geri Bildirim Notu',
      preferredResponse: 'Beklenen Çıktı',
      like: 'Beğendim',
      dislike: 'Beğenmedim',
      submit: 'Gönder',
      close: 'Kapat',
      provideFeedback: 'Lütfen geri bildirim ve puanlama yapın.'
    }
  };

  useEffect(() => {
    // Detect the device type
    const userAgent = navigator.userAgent;
    if (/mobile/i.test(userAgent)) {
      setDevice('mobile');
    } else if (/tablet/i.test(userAgent)) {
      setDevice('tablet');
    } else {
      setDevice('desktop');
    }
  }, []);

  const handleSubmit = async () => {
    // Validate feedback
    if (!feedbackText || !rating) {
      setErrorMessage(text[language].provideFeedback);
      return;
    }

    const feedbackData = {
      interactionId: null, // Leave it null; backend will generate it
      userId: "user_001", // Example, replace with actual user id
      timestamp: new Date().toISOString(),
      contentGenerated: {
        input_prompt: tweet, // Displayed tweet as the input prompt
        response: address // Address as the response
      },
      userFeedback: {
        rating: rating,
        feedback_text: feedbackText,
        preferred_response: preferredResponse // Preferred response entered by user
      },
        device: device,
        location: 'Unknown', // You can use an IP-based API to get location if needed
        session_duration: 45 // Example; you can calculate actual session duration
    };

    console.log("Prepared feedback data:", feedbackData); // Log the feedback data

    try {
      const response = await axios.post('/api/feedback/submit', feedbackData);
      console.log('Feedback submitted successfully:', response.data);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }

    onSubmit(feedbackData);
    onClose(); // Close the popup after submission
  };

  return (
    <div className={styles.popup}>
      <div className={styles.feedbackPopupContent}>
        <h2>{text[language].feedbackOnTweet}</h2>

        {/* Feedback Note Textarea */}
        <label>{text[language].feedbackNote}:</label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder={text[language].writeFeedback}
          className={styles.textArea}
        />

        {/* Preferred Response Textarea */}
        <label>{text[language].preferredResponse}:</label>
        <textarea
          value={preferredResponse}
          onChange={(e) => setPreferredResponse(e.target.value)}
          placeholder={text[language].preferredResponse}
          className={styles.textArea}
        />

        {/* Rating Options */}
        <div className={styles.ratingGroup}>
          <label>
            <input
              type="radio"
              value="like"
              checked={rating === 'like'}
              onChange={() => setRating('like')}
            />
            {text[language].like}
          </label>
          <label>
            <input
              type="radio"
              value="dislike"
              checked={rating === 'dislike'}
              onChange={() => setRating('dislike')}
            />
            {text[language].dislike}
          </label>
        </div>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        {/* Submit and Close Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleSubmit} className={styles.submitButton}>{text[language].submit}</button>
          <button onClick={onClose} className={styles.closeButton}>{text[language].close}</button>
        </div>
      </div>
    </div>
  );
}