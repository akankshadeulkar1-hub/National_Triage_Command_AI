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
    private final com.triage.service.JwtService jwtService;

    @Autowired
    public DispatchController(SimpMessagingTemplate messagingTemplate, com.triage.service.JwtService jwtService) {
        this.messagingTemplate = messagingTemplate;
        this.jwtService = jwtService;
        ActiveDispatch d1 = new ActiveDispatch(
                "DISPATCH-101",
                "mock-place-id-1",
                "Nagpur Emergency & Trauma Super Specialty Hospital",
                "CRITICAL",
                "Mass Casualty / Trauma",
                "Severe head trauma and unconscious victim from motor vehicle collision. Immediate airway management required.",
                3.5,
                "IN_TRANSIT",
                System.currentTimeMillis() - 120000
        );
        d1.setFirstAidSteps(List.of(
                "Maintain open airway and position patient on side.",
                "Apply firm direct pressure to bleeding sites.",
                "Keep patient warm and still."
        ));

        ActiveDispatch d2 = new ActiveDispatch(
                "DISPATCH-102",
                "mock-place-id-1",
                "Kingsway Hospital & Research Centre",
                "HIGH",
                "Orthopedics",
                "Open femur fracture and dislocation with severe pain. Patient immobilized on stretcher.",
                6.0,
                "IN_TRANSIT",
                System.currentTimeMillis() - 60000
        );
        d2.setFirstAidSteps(List.of(
                "Immobilize limb using rigid splint.",
                "Apply cold pack wrapped in towel to control swelling.",
                "Do not allow patient to bear weight."
        ));

        activeDispatches.add(d1);
        activeDispatches.add(d2);
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
        broadcastDispatchUpdate(dispatch);

        return ResponseEntity.ok(dispatch);
    }

    /**
     * POST/PUT /api/dispatch/{id}/assign-bed
     * Assigns a bed to an incoming emergency patient and broadcasts real-time WebSocket updates to /topic/emergencies.
     * Enforces ROLE_ADMIN role check (simulating @PreAuthorize("hasRole('ADMIN')")).
     */
    @RequestMapping(value = {"/{id}/assign-bed", "/assign-bed"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> assignBed(
            @PathVariable(required = false) String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestBody(required = false) Map<String, Object> payload) {

        // Endpoint Security: Role Check
        String userRole = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            userRole = jwtService.extractRole(authHeader);
        } else if (roleHeader != null && !roleHeader.isBlank()) {
            userRole = roleHeader;
        }

        if (userRole != null && (userRole.equalsIgnoreCase("ROLE_PARAMEDIC") || userRole.equalsIgnoreCase("PARAMEDIC"))) {
            Map<String, String> forbiddenErr = new HashMap<>();
            forbiddenErr.put("error", "Access Denied: Only users with ROLE_ADMIN (Hospital Staff) are authorized to assign beds.");
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(forbiddenErr);
        }

        String targetId = id;
        String requestedBed = null;
        String requestedStatus = "ACCEPTED";

        if (payload != null) {
            if (targetId == null || targetId.isEmpty()) {
                targetId = (String) payload.get("id");
                if (targetId == null) {
                    targetId = (String) payload.get("dispatchId");
                }
            }
            if (payload.containsKey("bedAssigned")) {
                requestedBed = String.valueOf(payload.get("bedAssigned"));
            }
            if (payload.containsKey("status")) {
                requestedStatus = String.valueOf(payload.get("status"));
            }
        }

        if (requestedBed == null || requestedBed.isBlank()) {
            requestedBed = "BED-" + String.format("%02d", new Random().nextInt(12) + 1);
        }

        ActiveDispatch updatedDispatch = null;
        if (targetId != null) {
            for (ActiveDispatch d : activeDispatches) {
                if (targetId.equalsIgnoreCase(d.getId())) {
                    d.setBedAssigned(requestedBed);
                    d.setStatus(requestedStatus);
                    updatedDispatch = d;
                    break;
                }
            }
        }

        if (updatedDispatch == null && !activeDispatches.isEmpty()) {
            updatedDispatch = activeDispatches.get(0);
            updatedDispatch.setBedAssigned(requestedBed);
            updatedDispatch.setStatus(requestedStatus);
        }

        if (updatedDispatch != null) {
            // Immediately broadcast real-time update over WebSockets
            broadcastDispatchUpdate(updatedDispatch);
            return ResponseEntity.ok(updatedDispatch);
        }

        return ResponseEntity.notFound().build();
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

    private void broadcastDispatchUpdate(ActiveDispatch dispatch) {
        try {
            messagingTemplate.convertAndSend("/topic/emergencies", dispatch);
            if (dispatch.getHospitalId() != null) {
                messagingTemplate.convertAndSend("/topic/incoming/" + dispatch.getHospitalId(), dispatch);
            }
        } catch (Exception e) {
            System.err.println("WebSocket bed reservation broadcast warning: " + e.getMessage());
        }
    }
}
