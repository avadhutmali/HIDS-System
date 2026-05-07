package com.aegis.aegis_server.api;

import com.aegis.aegis_server.dto.*;
import com.aegis.aegis_server.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    /**
     * POST /api/v1/agent/register — Device enrollment (PUBLIC)
     */
    @PostMapping("/register")
    public ResponseEntity<AgentRegistrationResponse> register(
            @Valid @RequestBody AgentRegistrationRequest request) {
        AgentRegistrationResponse response = agentService.registerDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/agent/heartbeat — Periodic score + telemetry push (AGENT JWT)
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<HeartbeatResponse> heartbeat(
            Authentication auth,
            @Valid @RequestBody HeartbeatRequest request) {
        UUID deviceId = UUID.fromString(auth.getName());
        HeartbeatResponse response = agentService.processHeartbeat(deviceId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/agent/policy — Pull current policy (AGENT JWT)
     */
    @GetMapping("/policy")
    public ResponseEntity<PolicyResponse> getPolicy(Authentication auth) {
        UUID deviceId = UUID.fromString(auth.getName());
        PolicyResponse response = agentService.getPolicy(deviceId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/agent/token/refresh — Refresh expired JWT (PUBLIC)
     */
    @PostMapping("/token/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = agentService.refreshToken(request);
        return ResponseEntity.ok(response);
    }
}
