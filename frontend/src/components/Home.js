import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode to decode the JWT token
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
  const [sortDirection, setSortDirection] = useState('asc'); // Sort direction for victim count
  const [onlyDroneValidated, setOnlyDroneValidated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Fetch reports from the backend and group by region, district, and neighborhood
  const loadFromCache = async () => {
    const cached = localStorage.getItem('cachedReports');
    if (!cached) return false;
    try {
      const cachedReports = JSON.parse(cached);

      const cachedTimestamp = localStorage.getItem('cachedReportsTimestamp');
      if (cachedTimestamp) {
        setLastUpdated(new Date(cachedTimestamp));
      }

      setAllReports(cachedReports); // wait until this is set
      setFilteredReports(cachedReports);

      const regions = [...new Set(cachedReports.map((r) => r.region))];
      const districtsByRegion = {};
      const neighborhoodsByDistrict = {};

      cachedReports.forEach(({ region, district, neighborhood }) => {
        if (!districtsByRegion[region]) districtsByRegion[region] = [];
        if (!districtsByRegion[region].includes(district)) {
          districtsByRegion[region].push(district);
        }

        if (!neighborhoodsByDistrict[district]) neighborhoodsByDistrict[district] = [];
        if (!neighborhoodsByDistrict[district].includes(neighborhood)) {
          neighborhoodsByDistrict[district].push(neighborhood);
        }
      });

      setRegions(regions);
      setDistrictsByRegion(districtsByRegion);
      setNeighborhoodsByDistrict(neighborhoodsByDistrict);

      return true;
    } catch (err) {
      console.warn('Failed to parse cached reports:', err);
      return false;
    }
  };


  const refreshFromAPI = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/api/reports');
      const reports = response.data;

      const parsedReports = reports.map((r) => {

        const parts = r.a?.split(' ') || [];
        return {
          id: r._id?.$oid || '',
          address: r.a,
          tweet: r.t,
          coordinates: r.c,
          contact: r.ct,
          victimCount: r.v,
          status: r.s,
          isDroneValidated: r.d,
          region: parts[0] || '',
          district: parts[1] || '',
          neighborhood: parts[2] || '',
        };
      });

      const validReports = parsedReports.filter((r) =>
        r.address?.trim() &&
        r.region &&
        r.district &&
        r.neighborhood &&
        r.coordinates?.lat !== 'N/A' &&
        r.coordinates?.lng !== 'N/A'
      );

      localStorage.setItem('cachedReports', JSON.stringify(validReports));
      localStorage.setItem('cachedReportsTimestamp', new Date().toISOString());
      setLastUpdated(new Date());

      // Same rendering logic:
      setFilteredReports(validReports);
      setAllReports(validReports);

      const regions = [...new Set(validReports.map((r) => r.region))];
      const districtsByRegion = {};
      const neighborhoodsByDistrict = {};

      validReports.forEach(({ region, district, neighborhood }) => {
        if (!districtsByRegion[region]) districtsByRegion[region] = [];
        if (!districtsByRegion[region].includes(district)) {
          districtsByRegion[region].push(district);
        }

        if (!neighborhoodsByDistrict[district]) neighborhoodsByDistrict[district] = [];
        if (!neighborhoodsByDistrict[district].includes(neighborhood)) {
          neighborhoodsByDistrict[district].push(neighborhood);
        }
      });

      setRegions(regions);
      setDistrictsByRegion(districtsByRegion);
      setNeighborhoodsByDistrict(neighborhoodsByDistrict);
    } catch (error) {
      const cached = localStorage.getItem('cachedReports');
      console.error('Error fetching reports from API:', error);
    } finally {
      setIsRefreshing(false);
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
    navigate(0); // Refresh the page
  };

  // Language switcher (save language preference in localStorage)
  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'TR' ? 'EN' : 'TR'));
    localStorage.setItem('language', language === 'TR' ? 'EN' : 'TR'); // Save new language to localStorage
  };

  useEffect(() => {
    if (allReports.length > 0) {
      handleFilterReports();
    }
  }, [allReports]);

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
      welcome: 'Depremzede Raporları',
      seeAllLocations: 'Tüm konumları gör',
      helpWaiting: 'Yardım Bekliyor',
      visited: 'Gidildi',
      false: 'Asılsız',
      isDroneValidated: 'Drone ile Doğrulandı',
      searchPlaceholder: 'Konuma göre ara...',
      regionPlaceholder: 'İl (Bölge)',
      districtPlaceholder: 'İlçe',
      neighborhoodPlaceholder: 'Mahalle',
      login: 'Giriş Yap',
      logout: 'Çıkış Yap',
      noResults: 'Sonuç bulunamadı',
      sortByVictims: 'Mağdur sayısına göre sırala',
      dataUpdating: 'Veriler güncelleniyor...',
    },
    EN: {
      welcome: 'Earthquake Victim Reports',
      seeAllLocations: 'See all locations',
      helpWaiting: 'Help Needed',
      visited: 'Visited',
      false: 'False Report',
      isDroneValidated: 'Drone Validated',
      searchPlaceholder: 'Search by location...',
      regionPlaceholder: 'Region',
      districtPlaceholder: 'District',
      neighborhoodPlaceholder: 'Neighborhood',
      login: 'Log In',
      logout: 'Log Out',
      noResults: 'No results found',
      sortByVictims: 'Sort by Victim Count',
      dataUpdating: 'Refreshing data...',
    },
  };

  useEffect(() => {
    const init = async () => {
      const loaded = await loadFromCache();
      await refreshFromAPI();
      checkUserStatus();
    };
    init();
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromAPI();
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, []);


  // Function to handle search and filtering
  const handleFilterReports = () => {
    const filtered = allReports.filter((report) => {
      const statusCondition =
        statusFilters.length === 0 ||
        statusFilters.length === 3 ||
        statusFilters.includes(report.status);

      const droneCondition =
        !onlyDroneValidated || report.isDroneValidated;

      return (
        (region === '' || report.region === region) &&
        (district === '' || report.district === district) &&
        (neighborhood === '' || report.neighborhood === neighborhood) &&
        statusCondition &&
        droneCondition &&
        (searchQuery === '' || report.address?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    setFilteredReports(filtered);
  };

  // Function to handle sorting by victim count
  const handleSortByVictims = () => {
    const sortedReports = [...filteredReports].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.victimCount - b.victimCount; // Ascending sort
      } else {
        return b.victimCount - a.victimCount; // Descending sort
      }
    });
    setFilteredReports(sortedReports);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); // Toggle sorting direction
  };

  // Whenever the region, district, or neighborhood changes, filter the reports
  useEffect(() => {
    handleFilterReports();
  }, [region, district, neighborhood, statusFilters, searchQuery, onlyDroneValidated]);

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

  // Function to handle updating the status of a report
  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      // Make a PATCH request to update the report status
      const response = await api.patch(`/api/reports/updateStatus/${reportId}`, { newStatus });

      if (response.status === 200) {
        // Update the state to reflect the new status of the report in allReports
        setAllReports((prevReports) => {
          return prevReports.map((report) =>
            report.id === reportId ? { ...report, status: newStatus } : report
          );
        });

        // Update the state to reflect the new status of the report in filteredReports
        setFilteredReports((prevFilteredReports) => {
          return prevFilteredReports.map((report) =>
            report.id === reportId ? { ...report, status: newStatus } : report
          );
        });

        // Optionally, reapply the filters again after the update
        handleFilterReports();
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
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

          {lastUpdated && (
            <p className={styles.lastUpdated}>
              {language === 'TR' ? 'Son güncelleme: ' : 'Last updated: '}
              {lastUpdated.toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US')}
            </p>
          )}

          {/* Combined Form with Search Bar, Dropdowns, Filter Buttons, and Sort Button */}
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
              <button
                type="button"
                className={`${styles.filterButton} ${onlyDroneValidated ? styles.active : ''}`}
                onClick={() => setOnlyDroneValidated(!onlyDroneValidated)}
              >
                {text[language].isDroneValidated}
              </button>
              {/* Button to navigate to all locations map */}
              <button
                type="button"
                className={styles.allLocationsButton}
                onClick={() => navigate('/locations')} // Navigate to /locations
              >
                {text[language].seeAllLocations}
              </button>
            </div>

            {/* Sort by Victim Count Button */}
            <div className={styles.sortButtonWrapper}>
              <button
                type="button"
                className={styles.sortButton}
                onClick={handleSortByVictims}
              >
                {text[language].sortByVictims} ({sortDirection === 'asc' ? '▲' : '▼'})
              </button>
            </div>
          </form>

          {/* Loading Indicator */}
          {isRefreshing && (
            <p className={styles.refreshingMessage}>
              {text[language].dataUpdating}
            </p>
          )}

          {/* Display the Filtered Reports */}
          <div className={styles.grid}>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  address={report.address}
                  victimCount={report.victimCount}
                  status={report.status}
                  tweet={report.tweet}
                  coordinates={[report.coordinates.lat, report.coordinates.lng]}
                  phoneNumber={report.contact?.p}
                  isDroneValidated={report.isDroneValidated}
                  needs={report.contact?.n}
                  language={language}
                  onUpdateStatus={(newStatus) => handleUpdateStatus(report.id, newStatus)}
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