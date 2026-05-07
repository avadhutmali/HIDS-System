package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminLoginResponse {
    private String token;
    private String role;
    private Long expiresIn;
}
