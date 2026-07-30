package com.triage.controller;

import com.triage.dto.TriageResponse;
import com.triage.service.TriageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/triage")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class TriageController {

    private final TriageService triageService;

    public TriageController(TriageService triageService) {
        this.triageService = triageService;
    }

    /**
     * POST /api/triage
     * Accepts multipart/form-data with optional 'audioFile', optional 'imageFile', and optional 'transcript' / 'vitalsText'
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TriageResponse> handleMultipartTriage(
            @RequestParam(value = "audioFile", required = false) MultipartFile audioFile,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "transcript", required = false) String transcript,
            @RequestParam(value = "vitalsText", required = false) String vitalsText) {
        try {
            String textPayload = (transcript != null && !transcript.isBlank()) ? transcript : vitalsText;

            TriageResponse response;
            if (audioFile != null && !audioFile.isEmpty()) {
                response = triageService.processAudioTriage(audioFile, textPayload, imageFile);
            } else {
                response = triageService.processTextTriage(textPayload, imageFile);
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new TriageResponse("LOW", "Error", e.getMessage(), 0.0, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new TriageResponse("HIGH", "Error", "Internal server error: " + e.getMessage(), 0.0, null));
        }
    }

    /**
     * POST /api/triage/text
     * Accepts application/json with { "vitalsText": "..." } or { "text": "..." }
     */
    @PostMapping(value = {"", "/text"}, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TriageResponse> handleTextTriage(@RequestBody Map<String, String> payload) {
        try {
            String text = payload.getOrDefault("vitalsText", payload.get("text"));
            if (text == null || text.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new TriageResponse("LOW", "Error", "Please provide a valid vitals or incident description.", 0.0, null));
            }

            TriageResponse response = triageService.processTextTriage(text);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new TriageResponse("LOW", "Error", e.getMessage(), 0.0, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new TriageResponse("HIGH", "Error", "Internal server error: " + e.getMessage(), 0.0, null));
        }
    }
}
