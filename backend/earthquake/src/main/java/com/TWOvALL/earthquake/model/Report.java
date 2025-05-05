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
    private boolean isDroneValidated;
    private Coordinates coordinates;
    private Location location;
    private ContactInfo contact;

    @Getter
    @Setter
    public static class Coordinates {
        private double latitude;
        private double longitude;
    }

    @Getter
    @Setter
    public static class Location {
        private String region;
        private String district;
        private String neighborhood;
    }

    @Getter
    @Setter
    public static class ContactInfo {
        private String phoneNumber;
        private String needs;
    }
}