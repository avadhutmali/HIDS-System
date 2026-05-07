package com.aegis.aegis_server.service;

import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.dto.ThreatReportRequest;
import com.aegis.aegis_server.dto.ThreatReportResponse;
import com.aegis.aegis_server.messaging.TelemetryPublisher;
import com.aegis.aegis_server.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThreatService {

    private final DeviceRepository deviceRepository;
    private final TelemetryPublisher telemetryPublisher;

    /**
     * Accept a threat report from an agent, publish to RabbitMQ for async processing.
     */
    public ThreatReportResponse reportThreat(UUID deviceId, ThreatReportRequest request) {
        // Verify device exists
        deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NoSuchElementException("Device not found: " + deviceId));

        // Validate event type
        try {
            EventType.valueOf(request.getEventType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid event type: " + request.getEventType());
        }

        // Publish to threat queue for async processing
        telemetryPublisher.publishThreatEvent(deviceId, request);

        log.info("Threat report queued from device {}: {}", deviceId, request.getEventType());

        return ThreatReportResponse.builder()
                .eventId(System.currentTimeMillis()) // temporary ID until consumer assigns real one
                .queued(true)
                .build();
    }
}
