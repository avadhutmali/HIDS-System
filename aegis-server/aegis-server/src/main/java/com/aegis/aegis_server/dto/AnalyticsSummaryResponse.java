package com.aegis.aegis_server.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnalyticsSummaryResponse {
    private Long devicesOnline;
    private Long alertsToday;
    private Long criticalActive;
    private Long erpHitsToday;
    private Map<String, Long> scoreDistribution; // clean, suspicious, compromised
    private List<ThreatTypeCount> topThreatTypes;

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ThreatTypeCount {
        private String type;
        private Long count;
    }
}
