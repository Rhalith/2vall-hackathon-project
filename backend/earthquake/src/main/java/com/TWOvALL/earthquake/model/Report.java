package com.TWOvALL.earthquake.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reports")
@Getter
@Setter
@CompoundIndex(name = "address_unique_idx", def = "{'address': 1}", unique = true)
public class Report {
    @Id
    private String id;
    private String address;
    private String locationHierarchy;
    private String tweet;
    private int victimCount;
    private String status;
    private String region;
    private String district;
    private String neighborhood;
    private String phoneNumber;
    private String needs;

    // New fields for coordinates
    private Coordinates coordinates;  // This will hold latitude and longitude

    // Inner class for coordinates
    @Getter
    @Setter
    public static class Coordinates {
        private String latitude;
        private String longitude;
    }
}