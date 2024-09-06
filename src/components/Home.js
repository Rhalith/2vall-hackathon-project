'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode to decode the JWT token
import ReportCard from './ReportCard'; // Import updated ReportCard component
import styles from './css/Home.module.css';
import api from './axiosconfig/Api';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [statusFilters, setStatusFilters] = useState([]); // Array to hold multiple status filters
  const [filteredReports, setFilteredReports] = useState([]); // State to hold filtered reports
  const [allReports, setAllReports] = useState([]); // To store all reports and reset if needed
  const [regions, setRegions] = useState([]); // State for unique regions
  const [districtsByRegion, setDistrictsByRegion] = useState({}); // State for districts grouped by region
  const [neighborhoodsByDistrict, setNeighborhoodsByDistrict] = useState({}); // State for neighborhoods grouped by district
  const [user, setUser] = useState(null); // Track if the user is logged in
  const [language, setLanguage] = useState('TR'); // Default language

  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Fetch reports from the backend and group by region, district, and neighborhood
  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports');
      const reports = response.data;

      // Filter out reports with 'Adres Bulunamadı' or empty region values
      const validReports = reports.filter((report) => 
        report.locationHierarchy !== 'Adres Bulunamadı.' &&
        report.region &&
        report.region.trim() !== '' &&
        report.coordinates && // Ensure coordinates exist
        report.coordinates.latitude !== 'N/A' &&
        report.coordinates.longitude !== 'N/A'
      );

      setFilteredReports(validReports); // Set filtered reports
      setAllReports(validReports); // Store all reports for reset

      // Extract regions, districts, and neighborhoods from the location_hierarchy
      const regions = [...new Set(validReports.map((report) => report.region))]; // Unique regions
      const districtsByRegion = {};
      const neighborhoodsByDistrict = {};

      // Group districts and neighborhoods based on regions and districts
      validReports.forEach((report) => {
        const { region, district, neighborhood } = report;

        if (region && district && neighborhood) {
          if (!districtsByRegion[region]) {
            districtsByRegion[region] = [];
          }
          if (!districtsByRegion[region].includes(district)) {
            districtsByRegion[region].push(district);
          }

          if (!neighborhoodsByDistrict[district]) {
            neighborhoodsByDistrict[district] = [];
          }
          if (!neighborhoodsByDistrict[district].includes(neighborhood)) {
            neighborhoodsByDistrict[district].push(neighborhood);
          }
        }
      });

      setRegions(regions); // Set regions for the dropdown
      setDistrictsByRegion(districtsByRegion); // Set districts grouped by region
      setNeighborhoodsByDistrict(neighborhoodsByDistrict); // Set neighborhoods grouped by district

    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  // Check if user is logged in
  const checkUserStatus = () => {
    const token = localStorage.getItem('jwtToken'); // Get JWT token from localStorage
    if (token) {
      try {
        jwtDecode(token); // If decoding works, user is logged in
        setUser(true); // Set user as logged in
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null); // In case of error, user is not logged in
      }
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('jwtToken'); // Remove JWT token from localStorage
    setUser(null); // Set user as logged out
    navigate('/login'); // Redirect to the login page
  };

  // Language switcher (save language preference in localStorage)
  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'TR' ? 'EN' : 'TR'));
    localStorage.setItem('language', language === 'TR' ? 'EN' : 'TR'); // Save new language to localStorage
  };


  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Language options for text
  const text = {
    TR: {
      welcome: 'Deprem Mağduru Raporları',
      seeAllLocations: 'Tüm konumları gör',
      helpWaiting: 'Yardım Bekliyor',
      visited: 'Gidildi',
      false: 'Asılsız',
      searchPlaceholder: 'Konuma göre ara...',
      regionPlaceholder: 'İl (Bölge)',
      districtPlaceholder: 'İlçe',
      neighborhoodPlaceholder: 'Mahalle',
      login: 'Giriş Yap',
      logout: 'Çıkış Yap',
    },
    EN: {
      welcome: 'Earthquake Victim Reports',
      seeAllLocations: 'See all locations',
      helpWaiting: 'Help Needed',
      visited: 'Visited',
      false: 'False Report',
      searchPlaceholder: 'Search by location...',
      regionPlaceholder: 'Region',
      districtPlaceholder: 'District',
      neighborhoodPlaceholder: 'Neighborhood',
      login: 'Log In',
      logout: 'Log Out',
    },
  };

  useEffect(() => {
    fetchReports(); // Fetch reports when the component mounts
    checkUserStatus(); // Check if the user is logged in
  }, []);

  // Function to handle search and filtering
  const handleFilterReports = () => {
    const filtered = allReports.filter((report) => {
      const statusCondition =
        statusFilters.length === 0 ||
        statusFilters.length === 3 ||
        statusFilters.includes(report.status);

      return (
        (region === '' || report.region === region) &&
        (district === '' || report.district === district) &&
        (neighborhood === '' || report.neighborhood === neighborhood) &&
        statusCondition &&
        (searchQuery === '' || report.locationHierarchy.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    setFilteredReports(filtered);
  };

  // Whenever the region, district, or neighborhood changes, filter the reports
  useEffect(() => {
    handleFilterReports();
  }, [region, district, neighborhood, statusFilters, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterReports();
  };

  const toggleStatusFilter = (status) => {
    setStatusFilters((prevFilters) => {
      if (prevFilters.includes(status)) {
        return prevFilters.filter((s) => s !== status);
      } else {
        return [...prevFilters, status];
      }
    });
  };

  const handleRegionChange = (e) => {
    setRegion(e.target.value);
    setDistrict(''); // Reset district when region changes
    setNeighborhood(''); // Reset neighborhood when region changes
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* Display Login or Logout button */}
        {user ? (
          <button 
            onClick={handleLogout} // Call logout function
            className={styles.loginButton}
          >
            {text[language].logout}
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')} // Navigate to /login if not logged in
            className={styles.loginButton}
          >
            {text[language].login}
          </button>
        )}

        {/* Language Switcher */}
        <div className={styles.languageSwitcher}>
        <button 
          onClick={toggleLanguage} // Toggle the language on click
          className={styles.languageButton}
        >
          {language === 'TR' ? 'EN' : 'TR'}
        </button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>{text[language].welcome}</h1>

          {/* Button to navigate to all locations map */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => navigate('/locations')} // Navigate to /locations
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
              }}
            >
              {text[language].seeAllLocations}
            </button>
          </div>

          {/* Combined Form with Search Bar, Dropdowns, and Filter Buttons */}
          <form onSubmit={handleSearch} className={styles.form}>
            <div className={styles.formRow}>
              {/* Search Bar */}
              <div className={`${styles.formColumn} ${styles.formColumnHalf}`}>
                <input
                  type="text"
                  placeholder={text[language].searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* Region Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={region}
                  onChange={handleRegionChange}
                  className={styles.select}
                >
                  <option value="">{text[language].regionPlaceholder}</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={styles.select}
                  disabled={!region}
                >
                  <option value="">{text[language].districtPlaceholder}</option>
                  {districtsByRegion[region]?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Neighborhood Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={styles.select}
                  disabled={!district}
                >
                  <option value="">{text[language].neighborhoodPlaceholder}</option>
                  {neighborhoodsByDistrict[district]?.map((neighborhood) => (
                    <option key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className={styles.filterButtons}>
              <button
                type="button"
                className={`${styles.filterButton} ${statusFilters.includes('Yardım Bekliyor') ? styles.active : ''}`}
                onClick={() => toggleStatusFilter('Yardım Bekliyor')}
              >
                {text[language].helpWaiting}
              </button>
              <button
                type="button"
                className={`${styles.filterButton} ${statusFilters.includes('Gidildi') ? styles.active : ''}`}
                onClick={() => toggleStatusFilter('Gidildi')}
              >
                {text[language].visited}
              </button>
              <button
                type="button"
                className={`${styles.filterButton} ${statusFilters.includes('Asılsız') ? styles.active : ''}`}
                onClick={() => toggleStatusFilter('Asılsız')}
              >
                {text[language].false}
              </button>
            </div>
          </form>

          {/* Display the Filtered Reports */}
          <div className={styles.grid}>
  {filteredReports.length > 0 ? (
    filteredReports.map((report) => (
      <ReportCard
        key={report.id}
        address={report.locationHierarchy}
        victimCount={report.victimCount}
        status={report.status}
        tweet={report.tweet}
        coordinates={[report.coordinates.latitude, report.coordinates.longitude]} // Pass coordinates here
        phoneNumber={report.phoneNumber} // Pass phoneNumber here
        needs={report.needs} // Pass needs here
        language={language} // Pass the selected language here
      />
    ))
  ) : (
    <p>{text[language].noResults}</p>
  )}
</div>
        </div>
      </main>
    </div>
  );
}