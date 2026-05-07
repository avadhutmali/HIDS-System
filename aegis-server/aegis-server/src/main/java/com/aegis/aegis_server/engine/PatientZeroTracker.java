package com.aegis.aegis_server.engine;

import com.aegis.aegis_server.domain.PatientZeroCluster;
import com.aegis.aegis_server.domain.SecurityEvent;
import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.repository.PatientZeroClusterRepository;
import com.aegis.aegis_server.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Correlates threat events across devices to identify Patient Zero —
 * the first device exhibiting a particular threat pattern in a time window.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PatientZeroTracker {

    private static final int CLUSTER_WINDOW_HOURS = 2;
    private static final int MIN_CLUSTER_SIZE = 3;

    private final SecurityEventRepository eventRepository;
    private final PatientZeroClusterRepository clusterRepository;

    /**
     * After a new threat event is processed, check if it forms or extends a cluster.
     */
    public Optional<PatientZeroCluster> correlate(SecurityEvent newEvent) {
        EventType eventType = newEvent.getEventType();
        Instant windowStart = Instant.now().minus(CLUSTER_WINDOW_HOURS, ChronoUnit.HOURS);

        // Find all events of the same type in the time window
        List<SecurityEvent> relatedEvents = eventRepository
                .findByEventTypeInWindow(eventType, windowStart);

        // Group by unique devices
        Set<UUID> affectedDeviceIds = relatedEvents.stream()
                .map(SecurityEvent::getDeviceId)
                .collect(Collectors.toSet());

        if (affectedDeviceIds.size() < MIN_CLUSTER_SIZE) {
            return Optional.empty();
        }

        // Find the earliest event (Patient Zero)
        SecurityEvent earliest = relatedEvents.stream()
                .min(Comparator.comparing(SecurityEvent::getOccurredAt))
                .orElse(newEvent);

        // Check if we already have a cluster for this pattern
        // If not, create one
        PatientZeroCluster cluster = PatientZeroCluster.builder()
                .threatPattern(eventType.name())
                .patientZeroId(earliest.getDeviceId())
                .affectedDevices(affectedDeviceIds.toArray(new UUID[0]))
                .firstSeen(earliest.getOccurredAt())
                .spreadCount(affectedDeviceIds.size())
                .build();

        cluster = clusterRepository.save(cluster);
        log.warn("Patient Zero cluster detected! Pattern: {}, Patient Zero Device: {}, Affected: {} devices",
                eventType, earliest.getDeviceId(), affectedDeviceIds.size());

        return Optional.of(cluster);
    }
}
