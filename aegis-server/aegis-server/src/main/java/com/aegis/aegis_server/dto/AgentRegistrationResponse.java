package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AgentRegistrationResponse {
    private String deviceId;
    private String jwtToken;
    private String refreshToken;
    private PolicyResponse policy;
}
