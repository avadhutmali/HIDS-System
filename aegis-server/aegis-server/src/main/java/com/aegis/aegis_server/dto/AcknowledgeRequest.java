package com.aegis.aegis_server.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AcknowledgeRequest {
    private String note;
}
