package com.aegis.aegis_server.api;

import com.aegis.aegis_server.domain.SecurityEvent;
import com.aegis.aegis_server.dto.*;
import com.aegis.aegis_server.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * POST /api/v1/admin/auth/login — Admin dashboard login (PUBLIC)
     */
    @PostMapping("/auth/login")
    public ResponseEntity<AdminLoginResponse> login(
            @Valid @RequestBody AdminLoginRequest request) {
        AdminLoginResponse response = adminService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/devices — List all enrolled devices with scores (ADMIN JWT)
     */
    @GetMapping("/devices")
    public ResponseEntity<DeviceListResponse> listDevices(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String deviceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        DeviceListResponse response = adminService.listDevices(department, riskLevel, deviceType, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/devices/{deviceId} — Full device detail + event timeline (ADMIN JWT)
     */
    @GetMapping("/devices/{deviceId}")
    public ResponseEntity<DeviceDetailResponse> getDeviceDetail(@PathVariable UUID deviceId) {
        DeviceDetailResponse response = adminService.getDeviceDetail(deviceId);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/v1/admin/devices/{deviceId}/block — Block/unblock ERP access (ADMIN JWT)
     */
    @PutMapping("/devices/{deviceId}/block")
    public ResponseEntity<Map<String, String>> blockDevice(
            @PathVariable UUID deviceId,
            @Valid @RequestBody DeviceBlockRequest request) {
        adminService.blockDevice(deviceId, request);
        Map<String, String> response = new HashMap<>();
        response.put("status", request.getBlocked() ? "BLOCKED" : "UNBLOCKED");
        response.put("deviceId", deviceId.toString());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/threats — Recent threat events, paginated (ADMIN JWT)
     */
    @GetMapping("/threats")
    public ResponseEntity<Map<String, Object>> listThreats(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Boolean acknowledged,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<SecurityEvent> eventPage = adminService.listThreats(
                severity, eventType, acknowledged, from, to, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("events", eventPage.getContent().stream().map(e -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", e.getId());
            dto.put("deviceId", e.getDeviceId());
            dto.put("eventType", e.getEventType().name());
            dto.put("severity", e.getSeverity().name());
            dto.put("payload", e.getPayload());
            dto.put("acknowledged", e.getAcknowledged());
            dto.put("occurredAt", e.getOccurredAt());
            dto.put("receivedAt", e.getReceivedAt());
            return dto;
        }).collect(Collectors.toList()));
        response.put("total", eventPage.getTotalElements());
        response.put("page", page);
        response.put("size", size);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/v1/admin/threats/{eventId}/acknowledge — Mark alert as acknowledged (ADMIN JWT)
     */
    @PutMapping("/threats/{eventId}/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeEvent(
            @PathVariable Long eventId,
            @RequestBody AcknowledgeRequest request) {
        adminService.acknowledgeEvent(eventId, request);
        Map<String, Object> response = new HashMap<>();
        response.put("eventId", eventId);
        response.put("acknowledged", true);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/analytics/summary — Dashboard summary stats (ADMIN JWT)
     */
    @GetMapping("/analytics/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getAnalyticsSummary() {
        AnalyticsSummaryResponse response = adminService.getAnalyticsSummary();
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/analytics/trends — Time-series data for charts (ADMIN JWT)
     */
    @GetMapping("/analytics/trends")
    public ResponseEntity<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "DAILY") String period,
            @RequestParam(defaultValue = "ALERTS") String metric) {
        // Simplified trends response
        Map<String, Object> response = new HashMap<>();
        response.put("period", period);
        response.put("metric", metric);
        response.put("data", java.util.List.of()); // TODO: Implement trend calculation
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/patient-zero — Active threat spread clusters (ADMIN JWT)
     */
    @GetMapping("/patient-zero")
    public ResponseEntity<PatientZeroResponse> getPatientZeroClusters() {
        PatientZeroResponse response = adminService.getPatientZeroClusters();
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/v1/admin/policy — Update global access policy (ADMIN JWT)
     */
    @PutMapping("/policy")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @Valid @RequestBody PolicyRequest request) {
        PolicyResponse response = adminService.updatePolicy(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/reports/export — Export security report as CSV (ADMIN JWT)
     */
    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(defaultValue = "CSV") String format,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {

        // Simplified CSV export
        StringBuilder csv = new StringBuilder();
        csv.append("id,deviceId,eventType,severity,occurredAt,acknowledged\n");

        Page<SecurityEvent> events = adminService.listThreats(
                null, null, null, from, to, 0, 10000);

        events.getContent().forEach(e -> {
            csv.append(e.getId()).append(",")
                    .append(e.getDeviceId()).append(",")
                    .append(e.getEventType()).append(",")
                    .append(e.getSeverity()).append(",")
                    .append(e.getOccurredAt()).append(",")
                    .append(e.getAcknowledged()).append("\n");
        });

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=aegis-report.csv")
                .body(csv.toString().getBytes());
    }
}
