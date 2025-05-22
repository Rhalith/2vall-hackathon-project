import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./css/DronePage.module.css";
import DroneModal from "./DroneModal";

export default function DronePage() {
  const [language, setLanguage] = useState("TR");
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [media, setMedia] = useState({ images: [], video: "" });
  const [stats, setStats] = useState({
    location: "",
    victimCount: null,
    status: "",
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "TR" ? "EN" : "TR";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const text = {
    TR: {
      title: "Drone Panel",
      buttons: [
        "1. Drone Görüntüsünü Dene",
        "2. Drone Görüntüsünü Dene",
        "3. Drone Görüntüsünü Dene",
      ],
      home: "Ana Sayfaya Dön",
      switchLang: "EN",
    },
    EN: {
      title: "Drone Panel",
      buttons: ["1. Try Drone View", "2. Try Drone View", "3. Try Drone View"],
      home: "Go Back to Homepage",
      switchLang: "TR",
    },
  };

  const handleClick = async (index) => {
    setModalOpen(true);
    setIsLoading(true);

    const locationNames = [
      "Kahramanmaraş Türkoğlu",
      "Hatay Antakya",
      "Adıyaman Merkez",
    ];
    setStats({
      location: locationNames[index],
      victimCount: Math.floor(Math.random() * 10) + 1,
      status: "Yardım Bekliyor",
    });

    // Simulate backend delay — later you'll replace this with an actual API call
    setTimeout(() => {
      setMedia({
        images: ["/mock/drone1.jpeg", "/mock/drone2.jpeg", "/mock/drone3.webp"],
        video: "/mock/sample-video.mp4",
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={toggleLanguage} className={styles.langButton}>
          {text[language].switchLang}
        </button>
        <button onClick={() => navigate("/")} className={styles.homeButton}>
          {text[language].home}
        </button>
      </div>

      <h1 className={styles.title}>{text[language].title}</h1>

      <div className={styles.buttonGroup}>
        {["Kahramanmaraş Türkoğlu", "Hatay Antakya", "Adıyaman Merkez"].map(
          (location, index) => (
            <div key={index} className={styles.buttonWrapper}>
              <div className={styles.buttonHeader}>{location}</div>
              <button
                onClick={() => handleClick(index)}
                className={styles.droneButton}
              >
                {language === "TR"
                  ? `${index + 1}. Drone Görüntüsünü Dene`
                  : `${index + 1}. Try Drone View`}
              </button>
            </div>
          )
        )}
        <DroneModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isLoading={isLoading}
          media={media}
          stats={stats}
          language={language}
        />
      </div>
    </div>
  );
}
