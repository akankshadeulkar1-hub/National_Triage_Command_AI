package com.triage.dto;

public class ActiveDispatch {
    private String id;
    private String hospitalId;
    private String hospitalName;
    private String priority;
    private String category;
    private String summary;
    private double etaMinutes;
    private String status; // "IN_TRANSIT", "ARRIVED"
    private long timestamp;
    private String mechanismOfInjury;

    public ActiveDispatch() {}

    public ActiveDispatch(String id, String hospitalId, String hospitalName, String priority, String category, String summary, double etaMinutes, String status, long timestamp) {
        this.id = id;
        this.hospitalId = hospitalId;
        this.hospitalName = hospitalName;
        this.priority = priority;
        this.category = category;
        this.summary = summary;
        this.etaMinutes = etaMinutes;
        this.status = status;
        this.timestamp = timestamp;
    }

    public ActiveDispatch(String id, String hospitalId, String hospitalName, String priority, String category, String summary, double etaMinutes, String status, long timestamp, String mechanismOfInjury) {
        this.id = id;
        this.hospitalId = hospitalId;
        this.hospitalName = hospitalName;
        this.priority = priority;
        this.category = category;
        this.summary = summary;
        this.etaMinutes = etaMinutes;
        this.status = status;
        this.timestamp = timestamp;
        this.mechanismOfInjury = mechanismOfInjury;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public double getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(double etaMinutes) { this.etaMinutes = etaMinutes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getMechanismOfInjury() { return mechanismOfInjury; }
    public void setMechanismOfInjury(String mechanismOfInjury) { this.mechanismOfInjury = mechanismOfInjury; }
}
