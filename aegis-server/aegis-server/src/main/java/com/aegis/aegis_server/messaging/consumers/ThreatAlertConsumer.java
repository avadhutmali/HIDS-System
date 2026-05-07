package com.aegis.aegis_server.messaging.consumers;

import com.aegis.aegis_server.domain.PatientZeroCluster;
import com.aegis.aegis_server.domain.SecurityEvent;
import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.domain.enums.Severity;
import com.aegis.aegis_server.dto.WebSocketAlertMessage;
import com.aegis.aegis_server.engine.PatientZeroTracker;
import com.aegis.aegis_server.engine.RuleEngine;
import com.aegis.aegis_server.messaging.RabbitConfig;
import com.aegis.aegis_server.messaging.TelemetryPublisher;
import com.aegis.aegis_server.repository.DeviceRepository;
import com.aegis.aegis_server.repository.SecurityEventRepository;
import com.aegis.aegis_server.websocket.AlertBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ThreatAlertConsumer {

    private final SecurityEventRepository eventRepository;
    private final DeviceRepository deviceRepository;
    private final RuleEngine ruleEngine;
    private final PatientZeroTracker patientZeroTracker;
    private final AlertBroadcaster alertBroadcaster;
    private final TelemetryPublisher telemetryPublisher;

    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitConfig.THREAT_QUEUE)
    public void processThreatEvent(Map<String, Object> message) {
        try {
            UUID deviceId = UUID.fromString((String) message.get("deviceId"));
            EventType eventType = EventType.valueOf((String) message.get("eventType"));
            Severity reportedSeverity = Severity.valueOf((String) message.get("severity"));
            Instant occurredAt = Instant.parse((String) message.get("occurredAt"));
            Map<String, Object> payload = (Map<String, Object>) message.getOrDefault("payload", Map.of());

            log.info("Processing threat event: {} from device {}", eventType, deviceId);

            // Apply rule engine for severity evaluation
            Severity finalSeverity = ruleEngine.evaluateSeverity(eventType, reportedSeverity, payload);

            // Persist the security event
            SecurityEvent event = SecurityEvent.builder()
                    .deviceId(deviceId)
                    .eventType(eventType)
                    .severity(finalSeverity)
                    .payload(payload)
                    .occurredAt(occurredAt)
                    .receivedAt(Instant.now())
                    .build();
            event = eventRepository.save(event);

            // Generate summary
            String summary = ruleEngine.generateSummary(eventType, payload);

            // WebSocket push if immediate alert
            if (ruleEngine.isImmediateAlert(finalSeverity)) {
                var device = deviceRepository.findById(deviceId).orElse(null);
                WebSocketAlertMessage alertMsg = WebSocketAlertMessage.builder()
                        .type("NEW_ALERT")
                        .eventId(event.getId())
                        .deviceId(deviceId.toString())
                        .deviceModel(device != null ? device.getDeviceModel() : "Unknown")
                        .prn(device != null ? device.getPrn() : "Unknown")
                        .eventType(eventType.name())
                        .severity(finalSeverity.name())
                        .summary(summary)
                        .timestamp(Instant.now())
                        .build();
                alertBroadcaster.broadcastAlert(alertMsg);
            }

            // Run Patient Zero correlation
            Optional<PatientZeroCluster> cluster = patientZeroTracker.correlate(event);
            cluster.ifPresent(c -> {
                alertBroadcaster.broadcastPatientZero(WebSocketAlertMessage.builder()
                        .type("PATIENT_ZERO")
                        .eventType(c.getThreatPattern())
                        .summary("Patient Zero cluster: " + c.getSpreadCount() + " devices affected")
                        .timestamp(Instant.now())
                        .build());
            });

            // Publish score update to score queue
            telemetryPublisher.publishScoreUpdate(deviceId);

        } catch (Exception e) {
            log.error("Failed to process threat event: {}", e.getMessage(), e);
            throw e;
        }
    }
}
