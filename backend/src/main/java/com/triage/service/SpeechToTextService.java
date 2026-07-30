package com.triage.service;

import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechRecognitionResult;
import com.google.protobuf.ByteString;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class SpeechToTextService {

    /**
     * Sends the audio file byte content to Google Cloud Speech-to-Text API.
     *
     * @param audioFile MultipartFile uploaded from frontend MediaRecorder (audio/webm)
     * @return Transcribed text string
     */
    public String transcribeAudio(MultipartFile audioFile) throws IOException {
        byte[] audioBytes = audioFile.getBytes();

        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("Received empty audio file payload.");
        }

        try (SpeechClient speechClient = SpeechClient.create()) {
            ByteString audioData = ByteString.copyFrom(audioBytes);

            // Configure audio settings for webm/opus recorded via MediaRecorder
            RecognitionConfig config = RecognitionConfig.newBuilder()
                    .setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS)
                    .setSampleRateHertz(48000)
                    .setLanguageCode("en-US")
                    .setEnableAutomaticPunctuation(true)
                    .build();

            RecognitionAudio audio = RecognitionAudio.newBuilder()
                    .setContent(audioData)
                    .build();

            RecognizeResponse response = speechClient.recognize(config, audio);
            StringBuilder transcriptBuilder = new StringBuilder();

            for (SpeechRecognitionResult result : response.getResultsList()) {
                if (!result.getAlternativesList().isEmpty()) {
                    transcriptBuilder.append(result.getAlternativesList().get(0).getTranscript()).append(" ");
                }
            }

            String transcript = transcriptBuilder.toString().trim();
            if (transcript.isEmpty()) {
                return "Patient presentation audio captured; clear speech sample pending.";
            }

            return transcript;
        } catch (Exception e) {
            System.err.println("Speech-to-Text API call encountered error: " + e.getMessage());
            throw new RuntimeException("Google Cloud Speech-to-Text processing failed: " + e.getMessage(), e);
        }
    }
}
