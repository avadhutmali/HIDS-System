package com.aegis.aegis_server.repository;

import com.aegis.aegis_server.domain.SecurityEvent;
import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.domain.enums.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    @Query("SELECT e FROM SecurityEvent e WHERE " +
           "(:severity IS NULL OR e.severity = :severity) AND " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:acknowledged IS NULL OR e.acknowledged = :acknowledged) AND " +
           "(:from IS NULL OR e.occurredAt >= :from) AND " +
           "(:to IS NULL OR e.occurredAt <= :to) " +
           "ORDER BY e.occurredAt DESC")
    Page<SecurityEvent> findWithFilters(
            @Param("severity") Severity severity,
            @Param("eventType") EventType eventType,
            @Param("acknowledged") Boolean acknowledged,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);

    List<SecurityEvent> findByDeviceIdOrderByOccurredAtDesc(UUID deviceId, Pageable pageable);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.receivedAt >= :since")
    Long countEventsSince(@Param("since") Instant since);

    @Query("SELECT COUNT(e) FROM SecurityEvent e WHERE e.severity = :severity AND e.acknowledged = false")
    Long countUnacknowledgedBySeverity(@Param("severity") Severity severity);

    @Query("SELECT e.eventType AS type, COUNT(e) AS cnt FROM SecurityEvent e " +
           "WHERE e.receivedAt >= :since GROUP BY e.eventType ORDER BY cnt DESC")
    List<Object[]> topThreatTypesSince(@Param("since") Instant since);

    @Query("SELECT e FROM SecurityEvent e WHERE e.eventType = :eventType " +
           "AND e.occurredAt >= :windowStart ORDER BY e.occurredAt ASC")
    List<SecurityEvent> findByEventTypeInWindow(
            @Param("eventType") EventType eventType,
            @Param("windowStart") Instant windowStart);
}
