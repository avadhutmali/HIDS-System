package com.aegis.aegis_server.engine;

import com.aegis.aegis_server.domain.Device;
import com.aegis.aegis_server.domain.SecurityEvent;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import com.aegis.aegis_server.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Computes and updates device security scores based on recent events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScoreCalculator {

    private final SecurityEventRepository eventRepository;
    private final RuleEngine ruleEngine;

    /**
     * Recalculate the score for a device based on recent events (last 24h).
     * Starts at 100 and applies deductions.
     */
    public int calculateScore(Device device) {
        int score = 100;

        // Get events from the last 24 hours
        Instant windowStart = Instant.now().minus(24, ChronoUnit.HOURS);
        List<SecurityEvent> recentEvents = eventRepository
                .findByDeviceIdOrderByOccurredAtDesc(device.getId(), PageRequest.of(0, 100));

        for (SecurityEvent event : recentEvents) {
            if (event.getOccurredAt().isAfter(windowStart)) {
                int deduction = ruleEngine.getScoreDeduction(event.getEventType());
                score -= deduction;
            }
        }

        // Clamp to 0-100
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Determine risk level based on score.
     */
    public RiskLevel determineRiskLevel(int score) {
        if (score >= 70) return RiskLevel.CLEAN;
        if (score >= 40) return RiskLevel.SUSPICIOUS;
        return RiskLevel.COMPROMISED;
    }
}
