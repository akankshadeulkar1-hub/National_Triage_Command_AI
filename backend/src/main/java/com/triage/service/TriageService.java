package com.triage.service;

import com.triage.dto.TriageResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class TriageService {

    private final SpeechToTextService speechToTextService;
    private final GeminiAnalysisService geminiAnalysisService;

    public TriageService(SpeechToTextService speechToTextService, GeminiAnalysisService geminiAnalysisService) {
        this.speechToTextService = speechToTextService;
        this.geminiAnalysisService = geminiAnalysisService;
    }

    public TriageResponse processTextTriage(String vitalsText) {
        return processTextTriage(vitalsText, null);
    }

    public TriageResponse processTextTriage(String vitalsText, MultipartFile imageFile) {
        if (vitalsText == null || vitalsText.trim().isEmpty()) {
            vitalsText = "Emergency patient incident report.";
        }

        byte[] imageBytes = null;
        String mimeType = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageBytes = imageFile.getBytes();
                mimeType = imageFile.getContentType();
            } catch (IOException e) {
                System.err.println("Error reading image file: " + e.getMessage());
            }
        }

        return geminiAnalysisService.analyzeMultimodal(vitalsText.trim(), imageBytes, mimeType);
    }

    public TriageResponse processAudioTriage(MultipartFile audioFile, String clientTranscript) throws IOException {
        return processAudioTriage(audioFile, clientTranscript, null);
    }

    public TriageResponse processAudioTriage(MultipartFile audioFile, String clientTranscript, MultipartFile imageFile) throws IOException {
        if (audioFile == null || audioFile.isEmpty()) {
            return processTextTriage(clientTranscript, imageFile);
        }

        String finalTranscript = null;

        if (clientTranscript != null && !clientTranscript.trim().isEmpty()) {
            finalTranscript = clientTranscript.trim();
        } else {
            try {
                finalTranscript = speechToTextService.transcribeAudio(audioFile);
            } catch (Exception e) {
                System.err.println("GCP Speech-to-Text note: " + e.getMessage());
            }
        }

        if (finalTranscript == null || finalTranscript.trim().isEmpty()) {
            finalTranscript = "Paramedic field voice recording received. Emergency patient presentation evaluated.";
        }

        byte[] imageBytes = null;
        String mimeType = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imageBytes = imageFile.getBytes();
            mimeType = imageFile.getContentType();
        }

        return geminiAnalysisService.analyzeMultimodal(finalTranscript, imageBytes, mimeType);
    }
}
