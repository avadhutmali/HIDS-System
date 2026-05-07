package com.aegis.aegis_server.service;

import com.aegis.aegis_server.domain.AccessPolicy;
import com.aegis.aegis_server.domain.Device;
import com.aegis.aegis_server.domain.enums.DeviceType;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import com.aegis.aegis_server.dto.*;
import com.aegis.aegis_server.messaging.TelemetryPublisher;
import com.aegis.aegis_server.repository.AccessPolicyRepository;
import com.aegis.aegis_server.repository.DeviceRepository;
import com.aegis.aegis_server.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final DeviceRepository deviceRepository;
    private final AccessPolicyRepository policyRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final TelemetryPublisher telemetryPublisher;

    /**
     * Register a new device (agent enrollment).
     */
    @Transactional
    public AgentRegistrationResponse registerDevice(AgentRegistrationRequest request) {
        if (!Boolean.TRUE.equals(request.getConsentAccepted())) {
            throw new IllegalArgumentException("Consent must be accepted for device registration");
        }

        UUID deviceId = UUID.randomUUID();

        Device device = Device.builder()
                .id(deviceId)
                .prn(request.getPrn())
                .deviceType(DeviceType.valueOf(request.getDeviceType()))
                .deviceModel(request.getDeviceModel())
                .department(request.getDepartment())
                .consentAccepted(true)
                .currentScore(100)
                .riskLevel(RiskLevel.CLEAN)
                .lastSeen(Instant.now())
                .enrolledAt(Instant.now())
                .erpAccessBlocked(false)
                .build();

        deviceRepository.save(device);

        String jwtToken = jwtTokenProvider.generateAgentToken(deviceId);
        String refreshToken = jwtTokenProvider.generateAgentRefreshToken(deviceId);

        // Build policy response
        PolicyResponse policyResponse = buildPolicyResponse(device);

        log.info("Device registered: {} ({}) for PRN {}", deviceId, request.getDeviceType(), request.getPrn());

        return AgentRegistrationResponse.builder()
                .deviceId(deviceId.toString())
                .jwtToken(jwtToken)
                .refreshToken(refreshToken)
                .policy(policyResponse)
                .build();
    }

    /**
     * Process a heartbeat from an agent.
     */
    @Transactional
    public HeartbeatResponse processHeartbeat(UUID deviceId, HeartbeatRequest request) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        // Publish to RabbitMQ for async processing
        telemetryPublisher.publishHeartbeat(deviceId, request);

        // Return immediate response
        // Check if policy has been updated since last heartbeat
        AccessPolicy policy = policyRepository.getPolicy();
        boolean policyUpdated = policy != null && policy.getUpdatedAt().isAfter(device.getLastSeen());

        return HeartbeatResponse.builder()
                .policyUpdated(policyUpdated)
                .erpAccessBlocked(device.getErpAccessBlocked())
                .policy(policyUpdated ? buildPolicyResponse(device) : null)
                .build();
    }

    /**
     * Get current policy for a device.
     */
    public PolicyResponse getPolicy(UUID deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));
        return buildPolicyResponse(device);
    }

    /**
     * Refresh an agent's JWT token.
     */
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        String tokenType = jwtTokenProvider.getTokenType(refreshToken);
        if (!"AGENT_REFRESH".equals(tokenType)) {
            throw new IllegalArgumentException("Invalid token type for refresh");
        }

        UUID deviceId = UUID.fromString(jwtTokenProvider.getSubject(refreshToken));

        // Verify device still exists
        deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found"));

        String newJwt = jwtTokenProvider.generateAgentToken(deviceId);
        String newRefresh = jwtTokenProvider.generateAgentRefreshToken(deviceId);

        return TokenRefreshResponse.builder()
                .jwtToken(newJwt)
                .refreshToken(newRefresh)
                .build();
    }

    private PolicyResponse buildPolicyResponse(Device device) {
        AccessPolicy policy = policyRepository.getPolicy();
        if (policy == null) {
            return PolicyResponse.builder()
                    .erpMinScore(60)
                    .knownBssids(List.of())
                    .appWhitelist(List.of())
                    .erpAccessBlocked(device.getErpAccessBlocked())
                    .build();
        }

        return PolicyResponse.builder()
                .erpMinScore(policy.getErpMinScore())
                .knownBssids(policy.getKnownBssids() != null ? Arrays.asList(policy.getKnownBssids()) : List.of())
                .appWhitelist(policy.getAppWhitelist() != null ? Arrays.asList(policy.getAppWhitelist()) : List.of())
                .erpAccessBlocked(device.getErpAccessBlocked())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }
}
