package com.aegis.aegis_server.messaging.consumers;

import com.aegis.aegis_server.domain.Device;
import com.aegis.aegis_server.domain.Heartbeat;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import com.aegis.aegis_server.dto.WebSocketAlertMessage;
import com.aegis.aegis_server.messaging.RabbitConfig;
import com.aegis.aegis_server.repository.AccessPolicyRepository;
import com.aegis.aegis_server.repository.DeviceRepository;
import com.aegis.aegis_server.repository.HeartbeatRepository;
import com.aegis.aegis_server.websocket.AlertBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelemetryConsumer {

    private final DeviceRepository deviceRepository;
    private final HeartbeatRepository heartbeatRepository;
    private final AccessPolicyRepository policyRepository;
    private final AlertBroadcaster alertBroadcaster;

    @RabbitListener(queues = RabbitConfig.TELEMETRY_QUEUE)
    public void processHeartbeat(Map<String, Object> message) {
        try {
            UUID deviceId = UUID.fromString((String) message.get("deviceId"));
            int score = ((Number) message.get("score")).intValue();
            String wifiBssid = (String) message.getOrDefault("wifiBssid", "");
            String ipAddress = (String) message.getOrDefault("ipAddress", "");

            log.debug("Processing heartbeat for device {}, score: {}", deviceId, score);

            // Save heartbeat
            Heartbeat heartbeat = Heartbeat.builder()
                    .deviceId(deviceId)
                    .score(score)
                    .wifiBssid(wifiBssid.isEmpty() ? null : wifiBssid)
                    .ipAddress(ipAddress.isEmpty() ? null : ipAddress)
                    .timestamp(Instant.now())
                    .build();
            heartbeatRepository.save(heartbeat);

            // Update device
            deviceRepository.findById(deviceId).ifPresent(device -> {
                device.setCurrentScore(score);
                device.setLastSeen(Instant.now());

                // Determine risk level
                if (score >= 70) device.setRiskLevel(RiskLevel.CLEAN);
                else if (score >= 40) device.setRiskLevel(RiskLevel.SUSPICIOUS);
                else device.setRiskLevel(RiskLevel.COMPROMISED);

                // Auto-block ERP if score below threshold
                var policy = policyRepository.getPolicy();
                if (policy != null && score < policy.getErpMinScore()) {
                    device.setErpAccessBlocked(true);
                }

                deviceRepository.save(device);

                // Broadcast device status to dashboard
                alertBroadcaster.broadcastDeviceStatus(WebSocketAlertMessage.builder()
                        .type("DEVICE_STATUS")
                        .deviceId(deviceId.toString())
                        .deviceModel(device.getDeviceModel())
                        .prn(device.getPrn())
                        .summary("Score: " + score + ", Risk: " + device.getRiskLevel())
                        .timestamp(Instant.now())
                        .build());
            });

        } catch (Exception e) {
            log.error("Failed to process heartbeat: {}", e.getMessage(), e);
            throw e; // Will be requeued or sent to DLQ
        }
    }
}
