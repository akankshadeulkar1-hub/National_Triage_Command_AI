package com.triage.controller;

import com.triage.dto.HospitalDto;
import com.triage.service.MapsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class HospitalController {

    private final MapsService mapsService;

    public HospitalController(MapsService mapsService) {
        this.mapsService = mapsService;
    }

    /**
     * GET /api/hospitals?lat={lat}&lng={lng}&specialty={specialty}
     * Returns nearby hospitals with real distance and mock availableBeds & availableAmbulances.
     */
    @GetMapping
    public ResponseEntity<List<HospitalDto>> getNearbyHospitals(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(value = "specialty", required = false) String specialty) {
        try {
            List<HospitalDto> hospitals = mapsService.findNearbyHospitals(lat, lng, specialty);
            return ResponseEntity.ok(hospitals);
        } catch (Exception e) {
            System.err.println("Error fetching nearby hospitals: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
