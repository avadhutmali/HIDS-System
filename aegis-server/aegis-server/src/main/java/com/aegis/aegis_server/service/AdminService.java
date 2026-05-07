package com.aegis.aegis_server.service;

import com.aegis.aegis_server.domain.*;
import com.aegis.aegis_server.domain.enums.DeviceType;
import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import com.aegis.aegis_server.domain.enums.Severity;
import com.aegis.aegis_server.dto.*;
import com.aegis.aegis_server.repository.*;
import com.aegis.aegis_server.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminUserRepository adminUserRepository;
    private final DeviceRepository deviceRepository;
    private final SecurityEventRepository eventRepository;
    private final HeartbeatRepository heartbeatRepository;
    private final AccessPolicyRepository policyRepository;
    private final PatientZeroClusterRepository clusterRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /**
     * Admin login — returns JWT on success.
     */
    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminUser admin = adminUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtTokenProvider.generateAdminToken(admin.getUsername(), admin.getRole());

        return AdminLoginResponse.builder()
                .token(token)
                .role(admin.getRole())
                .expiresIn(jwtTokenProvider.getAccessExpirationMs() / 1000)
                .build();
    }

    /**
     * List devices with optional filters and pagination.
     */
    public DeviceListResponse listDevices(String department, String riskLevel,
                                           String deviceType, int page, int size) {
        RiskLevel rl = riskLevel != null ? RiskLevel.valueOf(riskLevel) : null;
        DeviceType dt = deviceType != null ? DeviceType.valueOf(deviceType) : null;

        Page<Device> devicePage = deviceRepository.findWithFilters(
                department, rl, dt,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastSeen")));

        List<DeviceListResponse.DeviceDto> dtos = devicePage.getContent().stream()
                .map(this::toDeviceDto)
                .collect(Collectors.toList());

        return DeviceListResponse.builder()
                .devices(dtos)
                .total(devicePage.getTotalElements())
                .page(page)
                .size(size)
                .build();
    }

    /**
     * Get full device detail with recent events and score history.
     */
    public DeviceDetailResponse getDeviceDetail(UUID deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        // Recent events (last 50)
        List<SecurityEvent> events = eventRepository
                .findByDeviceIdOrderByOccurredAtDesc(deviceId, PageRequest.of(0, 50));

        List<DeviceDetailResponse.EventDto> eventDtos = events.stream()
                .map(e -> DeviceDetailResponse.EventDto.builder()
                        .id(e.getId())
                        .eventType(e.getEventType().name())
                        .severity(e.getSeverity().name())
                        .payload(e.getPayload())
                        .occurredAt(e.getOccurredAt())
                        .acknowledged(e.getAcknowledged())
                        .build())
                .collect(Collectors.toList());

        // Score history from heartbeats (last 50)
        List<Heartbeat> heartbeats = heartbeatRepository
                .findByDeviceIdOrderByTimestampDesc(deviceId, PageRequest.of(0, 50));

        List<DeviceDetailResponse.ScorePoint> scoreHistory = heartbeats.stream()
                .map(h -> DeviceDetailResponse.ScorePoint.builder()
                        .score(h.getScore())
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return DeviceDetailResponse.builder()
                .device(toDeviceDto(device))
                .recentEvents(eventDtos)
                .scoreHistory(scoreHistory)
                .build();
    }

    /**
     * Block or unblock ERP access for a device.
     */
    @Transactional
    public void blockDevice(UUID deviceId, DeviceBlockRequest request) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        device.setErpAccessBlocked(request.getBlocked());
        deviceRepository.save(device);

        log.info("Device {} ERP access {}: {}", deviceId,
                request.getBlocked() ? "BLOCKED" : "UNBLOCKED", request.getReason());
    }

    /**
     * List threat events with filters and pagination.
     */
    public Page<SecurityEvent> listThreats(String severity, String eventType,
                                            Boolean acknowledged, Instant from, Instant to,
                                            int page, int size) {
        Severity sev = severity != null ? Severity.valueOf(severity) : null;
        EventType et = eventType != null ? EventType.valueOf(eventType) : null;

        return eventRepository.findWithFilters(sev, et, acknowledged, from, to,
                PageRequest.of(page, size));
    }

    /**
     * Acknowledge a threat event.
     */
    @Transactional
    public void acknowledgeEvent(Long eventId, AcknowledgeRequest request) {
        SecurityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NoSuchElementException("Event not found: " + eventId));

        event.setAcknowledged(true);
        event.setAcknowledgeNote(request.getNote());
        eventRepository.save(event);

        log.info("Event {} acknowledged: {}", eventId, request.getNote());
    }

    /**
     * Get analytics summary for dashboard.
     */
    public AnalyticsSummaryResponse getAnalyticsSummary() {
        Instant todayStart = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant fiveMinutesAgo = Instant.now().minusSeconds(300);

        Long devicesOnline = deviceRepository.countOnlineSince(fiveMinutesAgo);
        Long alertsToday = eventRepository.countEventsSince(todayStart);
        Long criticalActive = eventRepository.countUnacknowledgedBySeverity(Severity.CRITICAL);

        Map<String, Long> scoreDistribution = new HashMap<>();
        scoreDistribution.put("clean", deviceRepository.countByRiskLevel(RiskLevel.CLEAN));
        scoreDistribution.put("suspicious", deviceRepository.countByRiskLevel(RiskLevel.SUSPICIOUS));
        scoreDistribution.put("compromised", deviceRepository.countByRiskLevel(RiskLevel.COMPROMISED));

        List<Object[]> topThreats = eventRepository.topThreatTypesSince(todayStart);
        List<AnalyticsSummaryResponse.ThreatTypeCount> threatCounts = topThreats.stream()
                .map(row -> AnalyticsSummaryResponse.ThreatTypeCount.builder()
                        .type(((EventType) row[0]).name())
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        return AnalyticsSummaryResponse.builder()
                .devicesOnline(devicesOnline)
                .alertsToday(alertsToday)
                .criticalActive(criticalActive)
                .erpHitsToday(0L) // Placeholder — would need ERP access log
                .scoreDistribution(scoreDistribution)
                .topThreatTypes(threatCounts)
                .build();
    }

    /**
     * Get Patient Zero clusters.
     */
    public PatientZeroResponse getPatientZeroClusters() {
        List<PatientZeroCluster> clusters = clusterRepository.findAllByOrderByFirstSeenDesc();

        List<PatientZeroResponse.ClusterDto> dtos = clusters.stream()
                .map(c -> {
                    DeviceListResponse.DeviceDto pzDevice = null;
                    if (c.getPatientZeroId() != null) {
                        pzDevice = deviceRepository.findById(c.getPatientZeroId())
                                .map(this::toDeviceDto).orElse(null);
                    }
                    return PatientZeroResponse.ClusterDto.builder()
                            .threatPattern(c.getThreatPattern())
                            .patientZeroDevice(pzDevice)
                            .affectedCount(c.getSpreadCount())
                            .firstSeen(c.getFirstSeen())
                            .build();
                })
                .collect(Collectors.toList());

        return PatientZeroResponse.builder().clusters(dtos).build();
    }

    /**
     * Update global access policy.
     */
    @Transactional
    public PolicyResponse updatePolicy(PolicyRequest request) {
        AccessPolicy policy = policyRepository.getPolicy();
        if (policy == null) {
            policy = new AccessPolicy();
        }

        policy.setErpMinScore(request.getErpMinScore());
        if (request.getKnownBssids() != null) {
            policy.setKnownBssids(request.getKnownBssids().toArray(new String[0]));
        }
        if (request.getAppWhitelist() != null) {
            policy.setAppWhitelist(request.getAppWhitelist().toArray(new String[0]));
        }
        policy.setUpdatedAt(Instant.now());

        policyRepository.save(policy);

        log.info("Policy updated: erpMinScore={}", request.getErpMinScore());

        return PolicyResponse.builder()
                .erpMinScore(policy.getErpMinScore())
                .knownBssids(request.getKnownBssids())
                .appWhitelist(request.getAppWhitelist())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }

    private DeviceListResponse.DeviceDto toDeviceDto(Device device) {
        return DeviceListResponse.DeviceDto.builder()
                .id(device.getId().toString())
                .prn(device.getPrn())
                .deviceModel(device.getDeviceModel())
                .deviceType(device.getDeviceType().name())
                .department(device.getDepartment())
                .currentScore(device.getCurrentScore())
                .riskLevel(device.getRiskLevel().name())
                .erpAccessBlocked(device.getErpAccessBlocked())
                .lastSeen(device.getLastSeen())
                .build();
    }
}
