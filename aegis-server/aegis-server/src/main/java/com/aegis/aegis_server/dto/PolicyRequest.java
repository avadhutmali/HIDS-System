package com.aegis.aegis_server.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PolicyRequest {
    @NotNull
    private Integer erpMinScore;
    private List<String> knownBssids;
    private List<String> appWhitelist;
}
