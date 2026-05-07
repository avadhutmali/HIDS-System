package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TokenRefreshResponse {
    private String jwtToken;
    private String refreshToken;
}
