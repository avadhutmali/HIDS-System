package com.aegis.aegis_server.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PatientZeroResponse {
    private List<ClusterDto> clusters;

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ClusterDto {
        private String threatPattern;
        private DeviceListResponse.DeviceDto patientZeroDevice;
        private Integer affectedCount;
        private Instant firstSeen;
    }
}
