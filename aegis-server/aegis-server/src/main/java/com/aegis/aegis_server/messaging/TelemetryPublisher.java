package com.aegis.aegis_server.messaging;

import com.aegis.aegis_server.dto.HeartbeatRequest;
import com.aegis.aegis_server.dto.ThreatReportRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelemetryPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish a heartbeat event to the telemetry queue.
     */
    public void publishHeartbeat(UUID deviceId, HeartbeatRequest request) {
        Map<String, Object> message = Map.of(
                "deviceId", deviceId.toString(),
                "score", request.getScore(),
                "wifiBssid", request.getWifiBssid() != null ? request.getWifiBssid() : "",
                "ipAddress", request.getIpAddress() != null ? request.getIpAddress() : "",
                "scoreBreakdown", request.getScoreBreakdown() != null ? request.getScoreBreakdown() : Map.of()
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "telemetry.heartbeat", message);
        log.debug("Published heartbeat for device {}", deviceId);
    }

    /**
     * Publish a threat event to the threat queue.
     */
    public void publishThreatEvent(UUID deviceId, ThreatReportRequest request) {
        Map<String, Object> message = Map.of(
                "deviceId", deviceId.toString(),
                "eventType", request.getEventType(),
                "severity", request.getSeverity(),
                "occurredAt", request.getOccurredAt().toString(),
                "payload", request.getPayload() != null ? request.getPayload() : Map.of()
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "threat.report", message);
        log.debug("Published threat event for device {}: {}", deviceId, request.getEventType());
    }

    /**
     * Publish a score update event (internal, after threat processing).
     */
    public void publishScoreUpdate(UUID deviceId) {
        Map<String, Object> message = Map.of(
                "deviceId", deviceId.toString()
        );
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "score.update", message);
        log.debug("Published score update for device {}", deviceId);
    }
}
