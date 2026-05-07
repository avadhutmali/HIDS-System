package com.aegis.aegis_server.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PolicyResponse {
    private Integer erpMinScore;
    private List<String> knownBssids;
    private List<String> appWhitelist;
    private Boolean erpAccessBlocked;
    private Instant updatedAt;
}
