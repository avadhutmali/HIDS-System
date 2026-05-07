package com.aegis.aegis_server.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HeartbeatRequest {

    @NotNull(message = "Score is required")
    private Integer score;

    private String wifiBssid;

    private String ipAddress;

    private Map<String, Object> scoreBreakdown;
}
