package com.TWOvALL.earthquake.service;

import com.TWOvALL.earthquake.model.Report;
import com.TWOvALL.earthquake.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    // The base URL for fetching a report by index
    private final String TWEET_API = "http://localhost:5000/get_address_by_index?index=";
    private final String KANDILLI_API = "http://localhost:5000/check_kandilli";

    // Track the current index globally
    private int currentIndex = 0;
    private final int MAX_INDEX = 250; // Set the maximum index to 250
    private boolean isKandilliActive;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ReportRepository reportRepository;

    /**
     * Fetch all reports from the database.
     *
     * @return a list of all reports.
     */
    public Iterable<Report> getAllReports() {
        return reportRepository.findAll();
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
            String address = (String) reportData.get("address");
            String locationHierarchy = (String) reportData.get("location_hierarchy");
            String tweet = (String) reportData.get("tweet");
            String victims = (String) reportData.get("victims");

            // New coordinate data from the API response
            Map<String, String> coordinates = (Map<String, String>) reportData.get("coordinates");

            // Important info (contains phone number and needs)
            String importantInfo = (String) reportData.get("important_info");
            System.out.println("Important Info: " + importantInfo);

            if (address == null || address.trim().isEmpty()) {
                logger.warn("Address not found for tweet: {}", tweet);
                address = "Unknown Address";
            }

            if (tweet == null || tweet.trim().isEmpty()) {
                logger.warn("Tweet not found for report with address: {}", address);
                tweet = "Unknown Tweet";
            }

            // Check if report with this address already exists
            if (!reportRepository.findAllByAddress(address).isEmpty()) {
                if (!address.equals("Adres bulunamadı")) {
                    logger.info("Report with address '{}' already exists. Skipping save.", address);
                    return; // Skip saving if there are existing reports with this address
                }
            }

            // Create and populate the report object
            Report report = new Report();
            report.setAddress(address);
            report.setLocationHierarchy(locationHierarchy);
            report.setTweet(tweet);
            report.setStatus("Yardım Bekliyor");

            // Set important info
            if (importantInfo != null && !importantInfo.trim().isEmpty()) {
                // Parse phone number and needs from the importantInfo field
                String phoneNumber = parsePhoneNumber(importantInfo);
                String needs = parseNeeds(importantInfo);

                report.setPhoneNumber(phoneNumber);
                report.setNeeds(needs);

                logger.info("Parsed important info - Phone: {}, Needs: {}", phoneNumber, needs);
            }

            // Handle victim count
            if (victims != null && !victims.equalsIgnoreCase("Depremzede sayısı bulunamadı")) {
                try {
                    report.setVictimCount(Integer.parseInt(victims.replaceAll("[^0-9]", "")));
                } catch (NumberFormatException e) {
                    logger.warn("Unable to parse victim count for tweet: {}", tweet);
                    report.setVictimCount(1); // Default if parsing fails
                }
            } else {
                report.setVictimCount(1); // Default victim count
            }

            // Parse location hierarchy to set region, district, and neighborhood
            parseLocationHierarchy(report);

            // Set coordinates (latitude and longitude)
            if (coordinates != null) {
                Report.Coordinates coord = new Report.Coordinates();
                coord.setLatitude(coordinates.getOrDefault("latitude", "N/A"));
                coord.setLongitude(coordinates.getOrDefault("longitude", "N/A"));
                report.setCoordinates(coord); // Set the coordinates object in the report
            }

            // Save the report in the repository
            reportRepository.save(report);
            logger.info("Saved report with address: {}", report.getAddress());

        } catch (Exception e) {
            logger.error("Error saving report: ", e);
        }
    }

    /**
     * Helper method to parse the location hierarchy string and set region, district, and neighborhood fields.
     *
     * @param report the report whose locationHierarchy is to be parsed.
     */
    private void parseLocationHierarchy(Report report) {
        String locationHierarchy = report.getLocationHierarchy();

        if (locationHierarchy != null && !locationHierarchy.trim().isEmpty() && !locationHierarchy.equalsIgnoreCase("Unknown Address")) {
            String[] locationParts = locationHierarchy.split(", ");
            if (locationParts.length >= 3) {
                report.setRegion(locationParts[0]); // Set region from locationHierarchy
                report.setDistrict(locationParts[1]); // Set district from locationHierarchy
                report.setNeighborhood(locationParts[2]); // Set neighborhood from locationHierarchy
            } else {
                logger.warn("Insufficient location parts for report: {}", locationHierarchy);
            }
        } else {
            logger.warn("LocationHierarchy is null or empty for report with tweet: {}", report.getTweet());
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

    public List<Report> getAllReports(boolean test) {
        return reportRepository.findAll();  // findAll() returns a List<Report>
    }

    /**
     * Helper method to parse the phone number from the important info string.
     */
    private String parsePhoneNumber(String importantInfo) {
        // Regex pattern to match phone numbers in various formats, including multiple phone numbers
        Pattern pattern = Pattern.compile("Telefon Numarası: ([\\d\\s\\(\\)\\+,-]+)");
        Matcher matcher = pattern.matcher(importantInfo);

        if (matcher.find()) {
            // Get the matched phone number string and split by comma if there are multiple numbers
            String phoneNumbers = matcher.group(1).trim();

            // Return the phone numbers, with each phone number trimmed
            return String.join(", ", phoneNumbers.split(",")).trim();
        }

        return "N/A";
    }

    /**
     * Helper method to parse the needs from the important info string.
     */
    private String parseNeeds(String importantInfo) {
        Pattern pattern = Pattern.compile("(İhtiyaç Listesi|Gereksinimler Listesi): (.+)");
        Matcher matcher = pattern.matcher(importantInfo);
        if (matcher.find()) {
            return matcher.group(2).trim(); // group(2) will contain the needs list
        }
        return "N/A";
    }
}