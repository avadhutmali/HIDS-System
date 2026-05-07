package com.aegis.aegis_server.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeviceBlockRequest {
    @NotNull
    private Boolean blocked;
    private String reason;
}
