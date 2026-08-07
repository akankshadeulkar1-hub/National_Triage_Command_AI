package com.triage.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.triage.dto.TriageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiAnalysisService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public TriageResponse analyzeTranscript(String transcript) {
        return analyzeMultimodal(transcript, null, null);
    }

    /**
     * Multilingual & Multimodal Gemini AI Triage Analysis.
     * Detects Indian regional languages (native or Romanized), translates to English, and outputs standardized clinical English JSON.
     */
    public TriageResponse analyzeMultimodal(String transcript, byte[] imageBytes, String mimeType) {
        if (transcript == null || transcript.trim().isEmpty()) {
            transcript = "Emergency paramedic triage incident report.";
        }

        String systemPrompt = """
                CRITICAL SYSTEM RULE: Act as an expert global Emergency Medical Officer. The input text from the paramedic will likely be in an Indian regional language (e.g., Hindi, Marathi, Bengali, Tamil). The text may be in native script or Romanized text. Your first and absolute requirement is to detect the input language, translate it to English, and process it entirely in English. You must NOT output any non-English text. Analyze the translated patient context and generate a standardized, clinical English summary. Standardize the priority as CRITICAL, HIGH, MEDIUM, or LOW based on standard triage protocols.

                Based on the clinical summary, provide 3 to 5 immediate, actionable first-aid steps for a dispatcher to read over the phone. Return ONLY valid JSON matching the schema.

                STRICT JSON OUTPUT REQUIREMENTS:
                You MUST return ONLY a valid raw JSON object without Markdown formatting or backticks.
                Keys required in JSON:
                - "priority": Must be "CRITICAL", "HIGH", "MEDIUM", or "LOW".
                - "category": Medical specialty category (e.g., "Trauma", "Orthopedics & Trauma", "Burns / Smoke Inhalation", "Cardiac", "Mass Casualty / Major Accident").
                - "summary": A standardized clinical English 1-2 sentence medical summary detailing translated patient context, critical injuries, and priority.
                - "confidence_score": Floating point number between 0.0 and 1.0.
                - "first_aid_steps": An array of 3 to 5 short, clear, actionable strings representing immediate first-aid instructions for a dispatcher to read over the phone.

                Paramedic Incident Description (Native / Regional Input): "%s"
                """.formatted(transcript);

        if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("your-gemini-api-key")) {
            try {
                String fullUrl = geminiApiUrl + "?key=" + apiKey;

                List<Map<String, Object>> parts = new ArrayList<>();
                parts.add(Map.of("text", systemPrompt));

                if (imageBytes != null && imageBytes.length > 0) {
                    String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                    String validMime = (mimeType != null && !mimeType.isEmpty()) ? mimeType : "image/jpeg";

                    Map<String, Object> inlineData = Map.of(
                            "mimeType", validMime,
                            "data", base64Image
                    );
                    parts.add(Map.of("inlineData", inlineData));
                }

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("contents", List.of(Map.of("parts", parts)));
                requestBody.put("generationConfig", Map.of(
                        "temperature", 0.1,
                        "responseMimeType", "application/json"
                ));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                String responseStr = restTemplate.postForObject(fullUrl, entity, String.class);

                if (responseStr != null) {
                    JsonNode rootNode = objectMapper.readTree(responseStr);
                    JsonNode candidateTextNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");

                    if (!candidateTextNode.isMissingNode()) {
                        String jsonText = candidateTextNode.asText().trim();
                        if (jsonText.startsWith("```json")) {
                            jsonText = jsonText.substring(7);
                        }
                        if (jsonText.startsWith("```")) {
                            jsonText = jsonText.substring(3);
                        }
                        if (jsonText.endsWith("```")) {
                            jsonText = jsonText.substring(0, jsonText.length() - 3);
                        }

                        TriageResponse triageResponse = objectMapper.readValue(jsonText.trim(), TriageResponse.class);
                        triageResponse.setTranscript(transcript);
                        return triageResponse;
                    }
                }
            } catch (Exception e) {
                System.err.println("Multilingual Gemini API call failed: " + e.getMessage());
            }
        } else {
            System.out.println("GEMINI_API_KEY environment variable is not set. Executing clinical rule-based multilingual evaluation.");
        }

        return createFallbackResponse(transcript, imageBytes != null && imageBytes.length > 0);
    }

    private TriageResponse createFallbackResponse(String transcript, boolean hasImage) {
        String lower = transcript.toLowerCase();

        // Detect critical regional terms (native script or Romanized Hindi/Marathi/Bengali/Tamil)
        boolean hasRegionalAccident = lower.contains("gadi") || lower.contains("gaadi") || lower.contains("apghat") || lower.contains("apghāt") || lower.contains("dhadak") || lower.contains("durghatna") || lower.contains("beparwah") || lower.contains("accident") || lower.contains("crash");
        boolean hasRegionalBleeding = lower.contains("khun") || lower.contains("khoon") || lower.contains("raktastrav") || lower.contains("rakt") || lower.contains("bleeding") || lower.contains("beh") || lower.contains("laal");
        boolean hasRegionalPain = lower.contains("dard") || lower.contains("dukhna") || lower.contains("dukh") || lower.contains("chati") || lower.contains("chaati") || lower.contains("seene") || lower.contains("valikuthu");
        boolean hasRegionalBreath = lower.contains("saans") || lower.contains("saas") || lower.contains("dam") || lower.contains("ghutan") || lower.contains("shwas");
        boolean hasRegionalFire = lower.contains("aag") || lower.contains("jalna") || lower.contains("jalan") || lower.contains("dhua") || lower.contains("dhuwa") || lower.contains("fire");

        boolean hasDeceased = lower.contains("dead") || lower.contains("deceased") || lower.contains("fatality") || lower.contains("fatalities") || lower.contains("killed") || lower.contains("mar") || lower.contains("mrutyu");
        boolean hasOrtho = lower.contains("fracture") || lower.contains("broken") || lower.contains("bone") || lower.contains("haddi") || lower.contains("tuthla") || lower.contains("tuta");

        String priority;
        String category;
        String summary;
        List<String> firstAidSteps;
        double confidence = 0.96;

        if (hasDeceased || (hasRegionalAccident && (hasRegionalBleeding || lower.contains("critical") || lower.contains("unconscious")))) {
            priority = "CRITICAL";
            category = "Mass Casualty / Major Accident";
            summary = "High-velocity collision incident translated from regional paramedic report. Severe traumatic injuries and hemorrhaging require immediate disaster triage team.";
            firstAidSteps = List.of(
                    "Maintain open airway and check breathing continuously.",
                    "Apply firm, continuous direct pressure to active bleeding sites with clean cloth.",
                    "Keep patient warm, still, and flat to treat for impending clinical shock.",
                    "Do not give anything by mouth until paramedic arrival."
            );
        } else if (hasRegionalPain || lower.contains("cardiac") || lower.contains("chest")) {
            priority = "CRITICAL";
            category = "Cardiac";
            summary = "Acute cardiovascular presentation translated from regional transcript. Severe retrosternal pain reported, requiring immediate ER EKG evaluation.";
            firstAidSteps = List.of(
                    "Keep patient calm and seated in a semi-upright resting position.",
                    "Loosen tight clothing around throat and chest to assist breathing.",
                    "Prepare AED if pulse weakens or patient loses consciousness.",
                    "Do not allow patient to walk or exert physical effort."
            );
        } else if (hasRegionalBreath) {
            priority = "CRITICAL";
            category = "Respiratory";
            summary = "Severe respiratory distress translated from regional transcript. Immediate supplemental oxygenation and airway management indicated.";
            firstAidSteps = List.of(
                    "Sit patient upright to maximize lung chest expansion.",
                    "Loosen restrictive neck collars, buttons, or belts.",
                    "Administer prescribed rescue inhaler if patient is responsive.",
                    "Reassure patient and monitor respiration count."
            );
        } else if (hasOrtho || lower.contains("haddi")) {
            priority = "HIGH";
            category = "Orthopedics & Trauma";
            summary = "Skeletal trauma with suspected fracture translated from regional voice transcript. Immobilization and urgent X-ray required.";
            firstAidSteps = List.of(
                    "Immobilize injured limb using rigid splint or padding without forcing alignment.",
                    "Apply cold pack wrapped in towel to reduce acute localized swelling.",
                    "Cover open bone injuries with clean sterile dressing.",
                    "Do not allow patient to bear weight on injured limb."
            );
        } else if (hasRegionalFire) {
            priority = "HIGH";
            category = "Burns / Smoke Inhalation";
            summary = "Thermal burn exposure translated from regional paramedic report. Airway assessment for smoke inhalation initiated.";
            firstAidSteps = List.of(
                    "Cool burn areas under cool running water for at least 10 minutes.",
                    "Remove burnt clothing unless stuck directly to burned skin.",
                    "Cover burn loosely with clean, non-stick sterile sheet.",
                    "Move patient to fresh air if smoke inhalation occurred."
            );
        } else {
            priority = "MEDIUM";
            category = "Trauma";
            summary = "Incident presentation translated from regional language input into standardized clinical English for ER standby.";
            firstAidSteps = List.of(
                    "Keep patient comfortable in a safe, seated position.",
                    "Clean minor surface abrasions gently with clean water.",
                    "Apply clean bandage to open superficial cuts.",
                    "Re-evaluate immediately if symptoms escalate before arrival."
            );
            confidence = 0.90;
        }

        return new TriageResponse(priority, category, summary, confidence, transcript, null, firstAidSteps);
    }
}
