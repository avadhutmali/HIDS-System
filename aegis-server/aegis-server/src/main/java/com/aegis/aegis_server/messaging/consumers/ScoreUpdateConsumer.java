package com.aegis.aegis_server.messaging.consumers;

import com.aegis.aegis_server.dto.WebSocketAlertMessage;
import com.aegis.aegis_server.engine.ScoreCalculator;
import com.aegis.aegis_server.messaging.RabbitConfig;
import com.aegis.aegis_server.repository.AccessPolicyRepository;
import com.aegis.aegis_server.repository.DeviceRepository;
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
public class ScoreUpdateConsumer {

    private final DeviceRepository deviceRepository;
    private final AccessPolicyRepository policyRepository;
    private final ScoreCalculator scoreCalculator;
    private final AlertBroadcaster alertBroadcaster;

    @RabbitListener(queues = RabbitConfig.SCORE_QUEUE)
    public void processScoreUpdate(Map<String, Object> message) {
        try {
            UUID deviceId = UUID.fromString((String) message.get("deviceId"));

            log.debug("Processing score update for device {}", deviceId);

            deviceRepository.findById(deviceId).ifPresent(device -> {
                // Recalculate score
                int newScore = scoreCalculator.calculateScore(device);
                var newRiskLevel = scoreCalculator.determineRiskLevel(newScore);

                device.setCurrentScore(newScore);
                device.setRiskLevel(newRiskLevel);

                // Auto-block ERP if score below threshold
                var policy = policyRepository.getPolicy();
                if (policy != null && newScore < policy.getErpMinScore()) {
                    device.setErpAccessBlocked(true);
                } else if (policy != null && newScore >= policy.getErpMinScore()) {
                    // Auto-unblock if score recovers (only if not manually blocked)
                    // Keep manual blocks — this is a simplification
                }

                deviceRepository.save(device);

                // Broadcast score update to dashboard
                alertBroadcaster.broadcastScoreUpdate(WebSocketAlertMessage.builder()
                        .type("SCORE_UPDATE")
                        .deviceId(deviceId.toString())
                        .deviceModel(device.getDeviceModel())
                        .prn(device.getPrn())
                        .summary("Score updated to " + newScore + " (" + newRiskLevel + ")")
                        .timestamp(Instant.now())
                        .build());
            });

        } catch (Exception e) {
            log.error("Failed to process score update: {}", e.getMessage(), e);
            throw e;
        }
    }
}
