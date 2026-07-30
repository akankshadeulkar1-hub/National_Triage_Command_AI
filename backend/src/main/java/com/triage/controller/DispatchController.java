package com.triage.controller;

import com.triage.dto.ActiveDispatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dispatch")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class DispatchController {

    private final List<ActiveDispatch> activeDispatches = new CopyOnWriteArrayList<>();
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public DispatchController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        activeDispatches.add(new ActiveDispatch(
                "DISPATCH-101",
                "mock-place-id-1",
                "City General Emergency Hospital & Trauma Center",
                "CRITICAL",
                "Mass Casualty / Trauma",
                "Severe head trauma and unconscious victim from motor vehicle collision. Immediate airway management required.",
                3.5,
                "IN_TRANSIT",
                System.currentTimeMillis() - 120000
        ));
        activeDispatches.add(new ActiveDispatch(
                "DISPATCH-102",
                "mock-place-id-1",
                "City General Emergency Hospital & Trauma Center",
                "HIGH",
                "Orthopedics",
                "Open femur fracture and dislocation with severe pain. Patient immobilized on stretcher.",
                6.0,
                "IN_TRANSIT",
                System.currentTimeMillis() - 60000
        ));
    }

    /**
     * POST /api/dispatch
     * Saves an ambulance dispatch record in memory and pushes live updates over WebSockets
     */
    @PostMapping
    public ResponseEntity<ActiveDispatch> createDispatch(@RequestBody ActiveDispatch dispatch) {
        if (dispatch.getId() == null || dispatch.getId().isEmpty()) {
            dispatch.setId("DISPATCH-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }
        if (dispatch.getStatus() == null || dispatch.getStatus().isEmpty()) {
            dispatch.setStatus("IN_TRANSIT");
        }
        if (dispatch.getTimestamp() == 0) {
            dispatch.setTimestamp(System.currentTimeMillis());
        }
        if (dispatch.getEtaMinutes() <= 0) {
            dispatch.setEtaMinutes(5.0);
        }

        // Add to front of list
        activeDispatches.add(0, dispatch);

        // Broadcast over WebSockets via SimpMessagingTemplate
        try {
            messagingTemplate.convertAndSend("/topic/emergencies", dispatch);
            if (dispatch.getHospitalId() != null) {
                messagingTemplate.convertAndSend("/topic/incoming/" + dispatch.getHospitalId(), dispatch);
            }
        } catch (Exception e) {
            System.err.println("WebSocket broadcast warning: " + e.getMessage());
        }

        return ResponseEntity.ok(dispatch);
    }

    /**
     * GET /api/dispatch/incoming
     * Returns all active incoming dispatches
     */
    @GetMapping("/incoming")
    public ResponseEntity<List<ActiveDispatch>> getAllIncoming() {
        return ResponseEntity.ok(activeDispatches);
    }

    /**
     * GET /api/dispatch/incoming/{hospitalId}
     * Returns list of all incoming emergencies for a specific hospital (or 'all')
     */
    @GetMapping("/incoming/{hospitalId}")
    public ResponseEntity<List<ActiveDispatch>> getIncomingByHospital(@PathVariable String hospitalId) {
        if ("all".equalsIgnoreCase(hospitalId)) {
            return ResponseEntity.ok(activeDispatches);
        }
        List<ActiveDispatch> filtered = activeDispatches.stream()
                .filter(d -> hospitalId.equalsIgnoreCase(d.getHospitalId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }
}
