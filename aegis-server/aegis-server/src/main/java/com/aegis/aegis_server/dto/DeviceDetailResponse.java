package com.aegis.aegis_server.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeviceDetailResponse {
    private DeviceListResponse.DeviceDto device;
    private List<EventDto> recentEvents;
    private List<ScorePoint> scoreHistory;

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class EventDto {
        private Long id;
        private String eventType;
        private String severity;
        private Map<String, Object> payload;
        private Instant occurredAt;
        private Boolean acknowledged;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ScorePoint {
        private Integer score;
        private Instant timestamp;
    }
}
