package com.aegis.aegis_server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ThreatReportRequest {

    @NotBlank(message = "Event type is required")
    private String eventType;

    @NotBlank(message = "Severity is required")
    private String severity;

    @NotNull(message = "Occurred timestamp is required")
    private Instant occurredAt;

    private Map<String, Object> payload;
}
