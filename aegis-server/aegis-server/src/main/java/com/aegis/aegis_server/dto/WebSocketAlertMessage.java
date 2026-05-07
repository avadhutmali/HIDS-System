package com.aegis.aegis_server.dto;

import lombok.*;

import java.time.Instant;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WebSocketAlertMessage {
    private String type; // NEW_ALERT, SCORE_UPDATE, DEVICE_STATUS, PATIENT_ZERO
    private Long eventId;
    private String deviceId;
    private String deviceModel;
    private String prn;
    private String eventType;
    private String severity;
    private String summary;
    private Instant timestamp;
}
