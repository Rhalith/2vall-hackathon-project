import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./css/DronePage.module.css";
import DroneModal from "./DroneModal";
import api from "./axiosconfig/Api";

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
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cachedReports, setCachedReports] = useState([]);
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) setLanguage(savedLanguage);

    const cached = localStorage.getItem("cachedReports");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCachedReports(parsed);
      } catch (err) {
        console.error("Failed to parse cachedReports:", err);
      }
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "TR" ? "EN" : "TR";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };
  const handleDroneValidationUpdate = async (isValid) => {
    const { region, district } = locationInfo[selectedIndex];

    const reportsToUpdate = cachedReports.filter(
      (r) => r.region === region && r.district === district
    );

    try {
      await Promise.all(
        reportsToUpdate.map((report) =>
          api.patch(`/api/reports/updateStatus/${report.id}`, {
            newStatus: report.status, // reusing the same field
            isDroneValidated: isValid, // new field added to backend
          })
        )
      );

      // Update local cached state
      const updated = cachedReports.map((report) =>
        report.region === region && report.district === district
          ? { ...report, isDroneValidated: isValid }
          : report
      );

      setCachedReports(updated);
      setStats((prev) => ({ ...prev, isDroneValidated: isValid }));
    } catch (error) {
      console.error("Error updating drone validation:", error);
    }
  };

  const locationInfo = [
    {
      name: "Kahramanmaraş Türkoğlu",
      region: "Kahramanmaraş",
      district: "Türkoğlu",
    },
    { name: "Hatay Antakya", region: "Hatay", district: "Antakya" },
    { name: "Adıyaman Merkez", region: "Adıyaman", district: "Bahçecik" },
  ];

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

    const { name, region, district } = locationInfo[index];

    const filtered = cachedReports.filter(
      (r) => r.region === region && r.district === district
    );
    const victimCount = filtered.reduce(
      (acc, curr) => acc + (curr.victimCount || 0),
      0
    );

    setStats({
      location: name,
      victimCount,
      isDroneValidated: filtered.some((r) => r.isDroneValidated),
    });

    const mediaMap = {
      0: {
        images: ["/mock/demo1-1.png", "/mock/demo1-2.png"],
        video: "/mock/demo1.mp4",
      },
      1: {
        images: ["/mock/demo2-1.png", "/mock/demo2-2.png"],
        video: "/mock/demo2.mp4",
      },
      2: {
        images: ["/mock/demo3-1.png", "/mock/demo3-2.png"],
        video: "/mock/demo3.mp4",
      },
    };
    setSelectedIndex(index);

    setTimeout(() => {
      setMedia(mediaMap[index]);
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
          onVerify={() => handleDroneValidationUpdate(true)}
          onDeny={() => handleDroneValidationUpdate(false)}
        />
      </div>
    </div>
  );
}
