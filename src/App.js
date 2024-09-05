'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import ReportCard from './components/ReportCard'
import styles from './App.module.css'

// Mock data for demonstration
const mockReports = [
  { id: 1, address: '123 Ana Cad., Ankara', victimCount: 5, status: 'Yardım Bekliyor', region: 'Ankara', district: 'Çankaya', neighborhood: 'Kavaklıdere' },
  { id: 2, address: '456 Meşe Cad., İstanbul', victimCount: 3, status: 'Gidildi', region: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Levent' },
  { id: 3, address: '789 Çamlık Sok., İzmir', victimCount: 7, status: 'Asılsız', region: 'İzmir', district: 'Konak', neighborhood: 'Alsancak' },
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [statusFilters, setStatusFilters] = useState([]) // Array to hold multiple status filters
  const [filteredReports, setFilteredReports] = useState(mockReports) // State to hold filtered reports

  // Function to handle search and filtering
  const handleFilterReports = () => {
    const filtered = mockReports.filter((report) => {
      // Filter by status: if none or all statuses are selected, show all reports
      const statusCondition = statusFilters.length === 0 || statusFilters.length === 3 || statusFilters.includes(report.status)

      return (
        (region === '' || report.region === region) &&
        (district === '' || report.district === district) &&
        (neighborhood === '' || report.neighborhood === neighborhood) &&
        statusCondition && // Apply the status filter condition
        (searchQuery === '' || report.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
    setFilteredReports(filtered)
  }

  // This will run the filtering whenever any of the filter values change
  useEffect(() => {
    handleFilterReports()
  }, [region, district, neighborhood, statusFilters, searchQuery]) // Listen to changes in the filters

  const handleSearch = (e) => {
    e.preventDefault()
    handleFilterReports() // Trigger filtering after search form submission
  }

  const handleStatusChange = (id, newStatus) => {
    const updatedReports = filteredReports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    )
    setFilteredReports(updatedReports)
  }

  // Toggle status filters (allow multiple selections)
  const toggleStatusFilter = (status) => {
    setStatusFilters((prevFilters) => {
      if (prevFilters.includes(status)) {
        // If already selected, remove it
        return prevFilters.filter(s => s !== status)
      } else {
        // Otherwise, add it to the filters
        return [...prevFilters, status]
      }
    })
  }

  // Handle "İl" (region) change: reset "İlçe" and "Mahalle"
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
                  onChange={handleRegionChange} // Use the new handler to reset İlçe and Mahalle
                  className={styles.select}
                >
                  <option value="">İl (Bölge)</option>
                  <option value="Ankara">Ankara</option>
                  <option value="İstanbul">İstanbul</option>
                  <option value="İzmir">İzmir</option>
                </select>
              </div>

              {/* District (İlçe) Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={styles.select}
                  disabled={!region} // Disable until "İl" is selected
                >
                  <option value="">İlçe</option>
                  {region === 'Ankara' && <option value="Çankaya">Çankaya</option>}
                  {region === 'İstanbul' && <option value="Beşiktaş">Beşiktaş</option>}
                  {region === 'İzmir' && <option value="Konak">Konak</option>}
                </select>
              </div>

              {/* Neighborhood (Mahalle) Dropdown */}
              <div className={`${styles.formColumn} ${styles.formColumnSmall}`}>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={styles.select}
                  disabled={!district} // Disable until "İlçe" is selected
                >
                  <option value="">Mahalle</option>
                  {district === 'Çankaya' && <option value="Kavaklıdere">Kavaklıdere</option>}
                  {district === 'Beşiktaş' && <option value="Levent">Levent</option>}
                  {district === 'Konak' && <option value="Alsancak">Alsancak</option>}
                </select>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className={styles.filterButtons}>
              <button 
                type="button" 
                className={`${styles.filterButton} ${statusFilters.includes('Yardım Bekliyor') ? styles.active : ''}`} 
                onClick={() => toggleStatusFilter('Yardım Bekliyor')}>
                Yardım Bekliyor
              </button>
              <button 
                type="button" 
                className={`${styles.filterButton} ${statusFilters.includes('Gidildi') ? styles.active : ''}`} 
                onClick={() => toggleStatusFilter('Gidildi')}>
                Gidildi
              </button>
              <button 
                type="button" 
                className={`${styles.filterButton} ${statusFilters.includes('Asılsız') ? styles.active : ''}`} 
                onClick={() => toggleStatusFilter('Asılsız')}>
                Asılsız
              </button>
            </div>

          </form>

          {/* Display the Filtered Reports */}
          <div className={styles.grid}>
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <ReportCard
                  key={report.id}
                  address={report.address}
                  victimCount={report.victimCount}
                  status={report.status}
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