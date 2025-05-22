import React from "react";
import styles from "./css/DroneModal.module.css";

export default function DroneModal({
  isOpen,
  onClose,
  isLoading,
  media,
  stats,
  language,
}) {
  const text = {
    TR: {
      loading: "Yükleniyor...",
      location: "Konum",
      victims: "Tahmini Mağdur Sayısı",
      status: "Durum",
      verify: "Doğrula",
      deny: "Reddet",
    },
    EN: {
      loading: "Loading...",
      location: "Location",
      victims: "Estimated Victim Count",
      status: "Status",
      verify: "Verify",
      deny: "Deny",
    },
  };
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        {isLoading ? (
          <p className={styles.loadingText}>{text[language].loading}</p>
        ) : (
          <div className={styles.content}>
            {/* Stats Section */}
            <div className={styles.statsSection}>
              <p>
                <strong>{text[language].location}:</strong>{" "}
                {stats?.location || "—"}
              </p>
              <p>
                <strong>{text[language].victims}:</strong>{" "}
                {stats?.victimCount ?? "—"}
              </p>
              <p>
                <strong>{text[language].status}:</strong> {stats?.status || "—"}
              </p>
            </div>

            {/* Media Section */}
            {media.video && (
              <video className={styles.video} controls>
                <source src={media.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            <div className={styles.images}>
              {media.images.map((src, idx) => (
                <img key={idx} src={src} alt={`Drone view ${idx + 1}`} />
              ))}
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button className={styles.verifyButton} onClick={onClose}>
                {text[language].verify}
              </button>
              <button className={styles.denyButton} onClick={onClose}>
                {text[language].deny}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
