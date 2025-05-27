package com.TWOvALL.earthquake.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "reports")
@Getter
@Setter
@CompoundIndex(name = "address_unique_idx", def = "{'address': 1}", unique = true)
public class Report {

    @Id
    @JsonProperty("i")
    private String id;

    @JsonProperty("a")
    private String address;

    @JsonProperty("t")
    private String tweet;

    @JsonProperty("v")
    private int victimCount;

    @JsonProperty("s")
    private String status;

    @JsonProperty("d")
    private boolean isDroneValidated;

    @JsonProperty("c")
    private Coordinates coordinates;

    @JsonProperty("ct")
    private ContactInfo contact;

    @Getter
    @Setter
    public static class Coordinates {
        @JsonProperty("lat") private double latitude;
        @JsonProperty("lng") private double longitude;
    }

    @Getter
    @Setter
    public static class ContactInfo {
        @JsonProperty("p") private String phoneNumber;
        @JsonProperty("n") private String needs;
    }
}

