package com.TWOvALL.earthquake.service;

import com.TWOvALL.earthquake.model.Report;
import com.TWOvALL.earthquake.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    // The base URL for fetching a report by index
    private final String TWEET_API = "https://2574-213-153-185-178.ngrok-free.app/get_address_by_index?index=";
    private final String KANDILLI_API = "https://2574-213-153-185-178.ngrok-free.app/check_kandilli";

    // Track the current index globally
    private int currentIndex = 0;
    private final int MAX_INDEX = 250; // Set the maximum index to 250
    private boolean isKandilliActive;

    private final RestTemplate restTemplate;

    private final ReportRepository reportRepository;

    public ReportService(RestTemplate restTemplate, ReportRepository reportRepository) {
        this.restTemplate = restTemplate;
        this.reportRepository = reportRepository;
    }

    /**
     * This method will fetch a single report when the application starts and save it to the database.
     */
    @PostConstruct
    public void fetchReportOnStartup() {
        logger.info("Fetching report on startup...");
        fetchAndSaveSingleReport();
    }

    /**
     * This method will periodically fetch a single report (every 1 hour) and save it to the database.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void fetchReportPeriodically() {
        checkKandilli();
        if(!isKandilliActive) return;
        logger.info("Fetching report periodically...");
        for (int i = 0; i < MAX_INDEX; i++) {
            fetchAndSaveSingleReport();
            i++;
        }
    }

    private void checkKandilli() {
        try {
            // Make a GET request to the KANDILLI_API and expect a Map<String, Object> as response
            Map<String, Object> response = restTemplate.getForObject(KANDILLI_API, Map.class);

            // Assuming the response contains a key "kandilli" which holds a boolean value
            if (response != null && response.containsKey("kandilli")) {
                isKandilliActive = (Boolean) response.get("kandilli"); // Cast the value to Boolean
                logger.info("Kandilli API is active: {}", isKandilliActive);
            } else {
                isKandilliActive = false;
                logger.warn("Kandilli API response did not contain 'kandilli' key.");
            }
        } catch (Exception e) {
            isKandilliActive = false;
            logger.error("Error while checking Kandilli API status: ", e);
        }
    }

    /**
     * Fetches a report based on the current index and saves it into the MongoDB database.
     * Stops fetching when currentIndex reaches the maximum (250).
     */
    public void fetchAndSaveSingleReport() {
        if (currentIndex > MAX_INDEX) {
            logger.info("Reached the maximum index limit: {}. No further reports will be fetched.", MAX_INDEX);
            return;
        }

        try {
            // Construct the URL with the current index
            String url = TWEET_API + currentIndex;

            // Fetch data from the external API
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("address")) {
                logger.info("Fetched report for index {}: {}", currentIndex, response);
                saveSingleReport(response);

                // Increment the index after successfully fetching and saving
                currentIndex++;
            } else {
                logger.warn("No report found for index {}.", currentIndex);
            }
        } catch (Exception e) {
            logger.error("Error while fetching report for index {}: ", currentIndex, e);
        }
    }

    /**
     * Helper method to save a single report.
     *
     * @param reportData the map containing report details.
     */
    private void saveSingleReport(Map<String, Object> reportData) {
        try {
            Map<String, Object> importantInfoMap = (Map<String, Object>) reportData.get("important_info");
            Map<String, String> coordinates = (Map<String, String>) reportData.get("coordinates");

            String address = importantInfoMap != null ? (String) importantInfoMap.get("address") : "Unknown Address";
            String tweet = (String) reportData.get("tweet");
            String victims = importantInfoMap != null ? (String) importantInfoMap.get("victims") : null;

            if (address == null || address.trim().isEmpty()) {
                logger.warn("Address not found for tweet: {}", tweet);
                address = "Unknown Address";
            }

            if (tweet == null || tweet.trim().isEmpty()) {
                logger.warn("Tweet not found for report with address: {}", address);
                tweet = "Unknown Tweet";
            }

            if (!reportRepository.findAllByAddress(address).isEmpty()) {
                if (!address.equals("Adres bulunamadı")) {
                    logger.info("Report with address '{}' already exists. Skipping save.", address);
                    return;
                }
            }

            Report report = new Report();
            report.setAddress(address);
            report.setTweet(tweet);
            report.setStatus("Yardım Bekliyor");

            if (importantInfoMap != null) {
                String phoneNumber = (String) importantInfoMap.get("phone");
                String needs = (String) importantInfoMap.get("needs");

                Report.ContactInfo contactInfo = new Report.ContactInfo();
                contactInfo.setPhoneNumber(phoneNumber != null ? phoneNumber : "N/A");
                contactInfo.setNeeds(needs != null ? needs : "N/A");
                report.setContact(contactInfo);
            }

            if (victims != null && !victims.equalsIgnoreCase("Depremzede sayısı bulunamadı")) {
                try {
                    report.setVictimCount(Integer.parseInt(victims.replaceAll("[^0-9]", "")));
                } catch (NumberFormatException e) {
                    logger.warn("Unable to parse victim count for tweet: {}", tweet);
                    report.setVictimCount(1);
                }
            } else {
                report.setVictimCount(1);
            }

            // Set coordinates
            if (coordinates != null) {
                Report.Coordinates coord = new Report.Coordinates();
                coord.setLatitude(coordinates.get("latitude") != null ? Double.parseDouble(coordinates.get("latitude")) : 0.0);
                coord.setLongitude(coordinates.get("longitude") != null ? Double.parseDouble(coordinates.get("longitude")) : 0.0);
                report.setCoordinates(coord);
            }

            // Set drone verification if present
            Boolean droneVerified = (Boolean) reportData.get("droneVerified");
            if (droneVerified != null) {
                report.setDroneValidated(droneVerified);
            }

            // Save the report
            reportRepository.save(report);
            logger.info("Saved report with address: {}", report.getAddress());

        } catch (Exception e) {
            logger.error("Error saving report: ", e);
        }
    }


    /**
     * Updates the status of a report based on its ID.
     *
     * @param reportId  the ID of the report to be updated.
     * @param newStatus the new status to be set.
     * @return the updated report.
     */
    public Report updateReportStatus(String reportId, String newStatus) {
        Optional<Report> reportOptional = reportRepository.findById(reportId);
        if (reportOptional.isPresent()) {
            Report report = reportOptional.get();
            report.setStatus(newStatus);
            logger.info("Updated report status for ID: {}", reportId);
            logger.info("New status: {}", newStatus);
            return reportRepository.save(report);
        } else {
            logger.warn("Report with ID {} not found", reportId);
            throw new RuntimeException("Report not found");
        }
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();  // findAll() returns a List<Report>
    }

}