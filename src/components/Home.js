'use client'

import { useState, useEffect } from 'react'
import ReportCard from './ReportCard'
import styles from './css/Home.module.css'
import api from './axiosconfig/Api'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [statusFilters, setStatusFilters] = useState([]) // Array to hold multiple status filters
  const [filteredReports, setFilteredReports] = useState([]) // State to hold filtered reports
  const [allReports, setAllReports] = useState([]) // To store all reports and reset if needed
  const [regions, setRegions] = useState([]) // State for unique regions
  const [districtsByRegion, setDistrictsByRegion] = useState({}) // State for districts grouped by region
  const [neighborhoodsByDistrict, setNeighborhoodsByDistrict] = useState({}) // State for neighborhoods grouped by district

  // Fetch reports from the backend and group by region, district, and neighborhood
  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports')
      const reports = response.data

      // Extract regions, districts, and neighborhoods from the reports
      const regions = [...new Set(reports.map(report => report.region))] // Unique regions
      const districtsByRegion = {}
      const neighborhoodsByDistrict = {}

      // Group districts and neighborhoods based on regions and districts
      reports.forEach(report => {
        const { region, district, neighborhood } = report

        if (!districtsByRegion[region]) {
          districtsByRegion[region] = []
        }
        if (!districtsByRegion[region].includes(district)) {
          districtsByRegion[region].push(district)
        }

        if (!neighborhoodsByDistrict[district]) {
          neighborhoodsByDistrict[district] = []
        }
        if (!neighborhoodsByDistrict[district].includes(neighborhood)) {
          neighborhoodsByDistrict[district].push(neighborhood)
        }
      })

      setFilteredReports(reports) // Set filtered reports
      setAllReports(reports) // Store all reports for reset
      setRegions(regions) // Set regions for the dropdown
      setDistrictsByRegion(districtsByRegion) // Set districts grouped by region
      setNeighborhoodsByDistrict(neighborhoodsByDistrict) // Set neighborhoods grouped by district
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  useEffect(() => {
    fetchReports() // Fetch reports when the component mounts
  }, [])

  // Function to handle search and filtering
  const handleFilterReports = () => {
    const filtered = allReports.filter((report) => {
      const statusCondition =
        statusFilters.length === 0 ||
        statusFilters.length === 3 ||
        statusFilters.includes(report.status)

      return (
        (region === '' || report.region === region) &&
        (district === '' || report.district === district) &&
        (neighborhood === '' || report.neighborhood === neighborhood) &&
        statusCondition &&
        (searchQuery === '' || report.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
    setFilteredReports(filtered)
  }

  // Whenever the region, district, or neighborhood changes, filter the reports
  useEffect(() => {
    handleFilterReports()
  }, [region, district, neighborhood, statusFilters, searchQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    handleFilterReports()
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/reports/updateStatus/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus),
      })
      const updatedReport = await response.json()

      setFilteredReports((prevReports) =>
        prevReports.map((report) =>
          report.id === id ? { ...report, status: updatedReport.status } : report
        )
      )
    } catch (error) {
      console.error('Error updating report status:', error)
    }
  }

  const toggleStatusFilter = (status) => {
    setStatusFilters((prevFilters) => {
      if (prevFilters.includes(status)) {
        return prevFilters.filter((s) => s !== status)
      } else {
        return [...prevFilters, status]
      }
    })
  }

  const handleRegionChange = (e) => {
    setRegion(e.target.value)
    setDistrict('') // Reset district when "İl" changes
    setNeighborhood('') // Reset neighborhood when "İl" changes
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Deprem Mağduru Raporları</h1>

          {/* Combined Form with Search Bar, Dropdowns, and Filter Buttons */}
          <form onSubmit={handleSearch} className={styles.form}>
            <div className={styles.formRow}>
              {/* Search Bar */}
              <div className={`${styles.formColumn} ${styles.formColumnHalf}`}>
                <input
                  type="text"
                  placeholder="Konuma göre ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* Region (İl) Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={region}
                  onChange={handleRegionChange}
                  className={styles.select}
                >
                  <option value="">İl (Bölge)</option>
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* District (İlçe) Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={styles.select}
                  disabled={!region}
                >
                  <option value="">İlçe</option>
                  {districtsByRegion[region]?.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Neighborhood (Mahalle) Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={styles.select}
                  disabled={!district}
                >
                  <option value="">Mahalle</option>
                  {neighborhoodsByDistrict[district]?.map(neighborhood => (
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
                Yardım Bekliyor
              </button>
              <button
                type="button"
                className={`${styles.filterButton} ${statusFilters.includes('Gidildi') ? styles.active : ''}`}
                onClick={() => toggleStatusFilter('Gidildi')}
              >
                Gidildi
              </button>
              <button
                type="button"
                className={`${styles.filterButton} ${statusFilters.includes('Asılsız') ? styles.active : ''}`}
                onClick={() => toggleStatusFilter('Asılsız')}
              >
                Asılsız
              </button>
            </div>
          </form>

          {/* Display the Filtered Reports */}
          <div className={styles.grid}>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  address={report.address}
                  victimCount={report.victimCount}
                  status={report.status}
                  tweet={report.tweet} // Passing the tweet URL to the ReportCard
                  onStatusChange={(newStatus) => handleStatusChange(report.id, newStatus)}
                />
              ))
            ) : (
              <p>Sonuç bulunamadı.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}