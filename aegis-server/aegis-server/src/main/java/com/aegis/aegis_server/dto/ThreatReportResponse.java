package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ThreatReportResponse {
    private Long eventId;
    private Boolean queued;
}
