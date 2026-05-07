package com.aegis.aegis_server.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeviceListResponse {
    private List<DeviceDto> devices;
    private Long total;
    private Integer page;
    private Integer size;

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class DeviceDto {
        private String id;
        private String prn;
        private String deviceModel;
        private String deviceType;
        private String department;
        private Integer currentScore;
        private String riskLevel;
        private Boolean erpAccessBlocked;
        private Instant lastSeen;
    }
}
