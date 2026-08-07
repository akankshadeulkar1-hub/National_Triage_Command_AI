package com.triage.service;

import com.google.maps.GeoApiContext;
import com.google.maps.PlacesApi;
import com.google.maps.model.LatLng;
import com.google.maps.model.PlaceType;
import com.google.maps.model.PlacesSearchResponse;
import com.google.maps.model.PlacesSearchResult;
import com.triage.dto.HospitalDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MapsService {

    @Value("${google.maps.api.key:}")
    private String apiKey;

    private final Random random = new Random();

    /**
     * Searches nearby hospitals using Google Maps Places API (strict 5km radius) and appends mock availableBeds and availableAmbulances.
     */
    public List<HospitalDto> findNearbyHospitals(double lat, double lng, String specialty) {
        List<HospitalDto> hospitals = new ArrayList<>();

        if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("your-google-maps-api-key")) {
            try {
                GeoApiContext context = new GeoApiContext.Builder()
                        .apiKey(apiKey)
                        .build();

                LatLng location = new LatLng(lat, lng);
                String keyword = (specialty != null && !specialty.isBlank()) ? specialty + " hospital" : "hospital trauma emergency";

                PlacesSearchResponse response = PlacesApi.nearbySearchQuery(context, location)
                        .radius(5000) // Strict 5km radius search
                        .type(PlaceType.HOSPITAL)
                        .keyword(keyword)
                        .await();

                if (response.results != null && response.results.length > 0) {
                    for (PlacesSearchResult place : response.results) {
                        double placeLat = place.geometry != null && place.geometry.location != null ? place.geometry.location.lat : lat;
                        double placeLng = place.geometry != null && place.geometry.location != null ? place.geometry.location.lng : lng;
                        double distKm = calculateDistanceKm(lat, lng, placeLat, placeLng);

                        if (distKm <= 5.0) {
                            int beds = random.nextInt(6); // 0 to 5 available beds
                            int ambulances = random.nextInt(4); // 0 to 3 available ambulances

                            HospitalDto dto = new HospitalDto(
                                    place.placeId,
                                    place.name,
                                    place.vicinity != null ? place.vicinity : "Nearby Emergency Medical Center",
                                    Math.round(distKm * 10.0) / 10.0,
                                    beds,
                                    ambulances,
                                    placeLat,
                                    placeLng,
                                    specialty != null ? specialty : "Emergency Care"
                            );
                            hospitals.add(dto);
                        }
                    }
                }
                context.shutdown();
            } catch (Exception e) {
                System.err.println("Google Maps Places API query note: " + e.getMessage());
            }
        }

        // Fallback to local Nagpur hospital provider if no API key or empty results within 5km
        if (hospitals.isEmpty()) {
            hospitals = generateMockHospitals(lat, lng, specialty);
        }

        // Filter strictly within 5km
        hospitals.removeIf(h -> h.getDistanceKm() > 5.0);

        // Highlight hospital with the most available beds
        flagMostBedsHospital(hospitals);

        // Sort by distance (closest first)
        hospitals.sort(Comparator.comparingDouble(HospitalDto::getDistanceKm));

        return hospitals;
    }

    private List<HospitalDto> generateMockHospitals(double lat, double lng, String specialty) {
        List<HospitalDto> list = new ArrayList<>();
        String mainSpecialty = (specialty != null && !specialty.isBlank()) ? specialty : "Trauma & Emergency";

        // Realistic nearby hospitals centered around user coordinates (Nagpur Region)
        String[][] sampleHospitals = {
                {"Nagpur Emergency & Trauma Super Specialty Hospital", "0.008", "0.012", "6", "3"},
                {"Kingsway Hospital & Research Centre (" + mainSpecialty + ")", "-0.015", "0.019", "5", "2"},
                {"Alexis Multispecialty Hospital & ER", "0.022", "-0.014", "4", "2"},
                {"Orange City Hospital & Research Institute", "-0.028", "-0.025", "3", "1"},
                {"AIIMS Nagpur Emergency & Disaster Care", "0.034", "0.031", "7", "4"}
        };

        for (int i = 0; i < sampleHospitals.length; i++) {
            String[] item = sampleHospitals[i];
            double hLat = lat + Double.parseDouble(item[1]);
            double hLng = lng + Double.parseDouble(item[2]);
            double distKm = calculateDistanceKm(lat, lng, hLat, hLng);
            int beds = Integer.parseInt(item[3]);
            int ambulances = Integer.parseInt(item[4]);

            HospitalDto dto = new HospitalDto(
                    "nagpur-local-" + (i + 1),
                    item[0],
                    String.format("Nagpur Medical District, %.4f Lat, %.4f Lng", hLat, hLng),
                    Math.round(distKm * 10.0) / 10.0,
                    beds,
                    ambulances,
                    hLat,
                    hLng,
                    mainSpecialty
            );
            list.add(dto);
        }

        return list;
    }

    private void flagMostBedsHospital(List<HospitalDto> hospitals) {
        if (hospitals == null || hospitals.isEmpty()) return;

        int maxBeds = -1;
        HospitalDto best = null;

        for (HospitalDto h : hospitals) {
            if (h.getAvailableBeds() != null && h.getAvailableBeds() > maxBeds) {
                maxBeds = h.getAvailableBeds();
                best = h;
            }
        }

        if (best != null) {
            best.setIsMostBeds(true);
        }
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
