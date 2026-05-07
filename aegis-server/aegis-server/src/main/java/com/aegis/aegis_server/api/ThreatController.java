package com.aegis.aegis_server.api;

import com.aegis.aegis_server.dto.ThreatReportRequest;
import com.aegis.aegis_server.dto.ThreatReportResponse;
import com.aegis.aegis_server.service.ThreatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/threats")
@RequiredArgsConstructor
public class ThreatController {

    private final ThreatService threatService;

    /**
     * POST /api/v1/threats/report — Report threat event (AGENT JWT)
     * Returns 202 Accepted — event queued for async processing.
     */
    @PostMapping("/report")
    public ResponseEntity<ThreatReportResponse> reportThreat(
            Authentication auth,
            @Valid @RequestBody ThreatReportRequest request) {
        UUID deviceId = UUID.fromString(auth.getName());
        ThreatReportResponse response = threatService.reportThreat(deviceId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
