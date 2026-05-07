package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HeartbeatResponse {
    private Boolean policyUpdated;
    private Boolean erpAccessBlocked;
    private PolicyResponse policy; // non-null only if policyUpdated = true
}
