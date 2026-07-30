package com.triage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TriageResponse {

    @JsonProperty("priority")
    private String priority;

    @JsonProperty("category")
    private String category;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("transcript")
    private String transcript;

    @JsonProperty("mechanismOfInjury")
    private String mechanismOfInjury;

    public TriageResponse() {}

    public TriageResponse(String priority, String category, String summary, Double confidenceScore, String transcript) {
        this.priority = priority;
        this.category = category;
        this.summary = summary;
        this.confidenceScore = confidenceScore;
        this.transcript = transcript;
    }

    public TriageResponse(String priority, String category, String summary, Double confidenceScore, String transcript, String mechanismOfInjury) {
        this.priority = priority;
        this.category = category;
        this.summary = summary;
        this.confidenceScore = confidenceScore;
        this.transcript = transcript;
        this.mechanismOfInjury = mechanismOfInjury;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getMechanismOfInjury() {
        return mechanismOfInjury;
    }

    public void setMechanismOfInjury(String mechanismOfInjury) {
        this.mechanismOfInjury = mechanismOfInjury;
    }
}
