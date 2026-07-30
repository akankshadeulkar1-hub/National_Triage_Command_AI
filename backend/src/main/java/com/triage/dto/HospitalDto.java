package com.triage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class HospitalDto {

    @JsonProperty("place_id")
    private String placeId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("address")
    private String address;

    @JsonProperty("distance_km")
    private Double distanceKm;

    @JsonProperty("availableBeds")
    private Integer availableBeds;

    @JsonProperty("availableAmbulances")
    private Integer availableAmbulances;

    @JsonProperty("lat")
    private Double lat;

    @JsonProperty("lng")
    private Double lng;

    @JsonProperty("isMostBeds")
    private Boolean isMostBeds;

    @JsonProperty("specialty")
    private String specialty;

    public HospitalDto() {}

    public HospitalDto(String placeId, String name, String address, Double distanceKm, Integer availableBeds, Integer availableAmbulances, Double lat, Double lng, String specialty) {
        this.placeId = placeId;
        this.name = name;
        this.address = address;
        this.distanceKm = distanceKm;
        this.availableBeds = availableBeds;
        this.availableAmbulances = availableAmbulances;
        this.lat = lat;
        this.lng = lng;
        this.specialty = specialty;
        this.isMostBeds = false;
    }

    public String getPlaceId() { return placeId; }
    public void setPlaceId(String placeId) { this.placeId = placeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public Integer getAvailableBeds() { return availableBeds; }
    public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }

    public Integer getAvailableAmbulances() { return availableAmbulances; }
    public void setAvailableAmbulances(Integer availableAmbulances) { this.availableAmbulances = availableAmbulances; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Boolean getIsMostBeds() { return isMostBeds; }
    public void setIsMostBeds(Boolean isMostBeds) { this.isMostBeds = isMostBeds; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
}
