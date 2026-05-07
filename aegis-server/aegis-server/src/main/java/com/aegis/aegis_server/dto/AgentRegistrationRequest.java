package com.aegis.aegis_server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AgentRegistrationRequest {

    @NotBlank(message = "PRN is required")
    private String prn;

    @NotBlank(message = "Device type is required")
    private String deviceType; // ANDROID | PC

    private String deviceModel;

    private String department;

    @NotNull(message = "Consent acceptance is required")
    private Boolean consentAccepted;
}
