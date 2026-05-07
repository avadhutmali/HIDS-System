package com.aegis.aegis_server.engine;

import com.aegis.aegis_server.domain.enums.EventType;
import com.aegis.aegis_server.domain.enums.Severity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Rule engine for evaluating threat events and determining severity escalation.
 */
@Slf4j
@Component
public class RuleEngine {

    // Default severity mapping for event types
    private static final Map<EventType, Severity> DEFAULT_SEVERITY = Map.of(
            EventType.EVIL_TWIN, Severity.CRITICAL,
            EventType.APK_UNKNOWN_SOURCE, Severity.HIGH,
            EventType.OTP_READER_APP, Severity.HIGH,
            EventType.ERP_BRUTEFORCE, Severity.HIGH,
            EventType.FIM_CHANGE, Severity.MEDIUM,
            EventType.PROCESS_ANOMALY, Severity.MEDIUM,
            EventType.PORT_SCAN, Severity.HIGH,
            EventType.MALICIOUS_IP, Severity.HIGH
    );

    // Score deduction weights per event type
    private static final Map<EventType, Integer> SCORE_DEDUCTION = Map.of(
            EventType.EVIL_TWIN, 30,
            EventType.APK_UNKNOWN_SOURCE, 20,
            EventType.OTP_READER_APP, 25,
            EventType.ERP_BRUTEFORCE, 15,
            EventType.FIM_CHANGE, 10,
            EventType.PROCESS_ANOMALY, 10,
            EventType.PORT_SCAN, 15,
            EventType.MALICIOUS_IP, 20
    );

    /**
     * Evaluate and potentially escalate the severity of an event.
     */
    public Severity evaluateSeverity(EventType eventType, Severity reportedSeverity,
                                     Map<String, Object> payload) {
        Severity defaultSev = DEFAULT_SEVERITY.getOrDefault(eventType, Severity.MEDIUM);

        // Use the more severe between reported and default
        if (severityOrdinal(reportedSeverity) < severityOrdinal(defaultSev)) {
            return reportedSeverity; // reported is more severe
        }
        return defaultSev;
    }

    /**
     * Get the score deduction for an event type.
     */
    public int getScoreDeduction(EventType eventType) {
        return SCORE_DEDUCTION.getOrDefault(eventType, 5);
    }

    /**
     * Check if the event severity warrants an immediate alert.
     */
    public boolean isImmediateAlert(Severity severity) {
        return severity == Severity.CRITICAL || severity == Severity.HIGH;
    }

    /**
     * Generate a human-readable summary for a threat event.
     */
    public String generateSummary(EventType eventType, Map<String, Object> payload) {
        return switch (eventType) {
            case EVIL_TWIN -> "Rogue AP detected: BSSID " +
                    payload.getOrDefault("bssid", "unknown");
            case APK_UNKNOWN_SOURCE -> "Unknown-source APK installed: " +
                    payload.getOrDefault("packageName", "unknown");
            case OTP_READER_APP -> "OTP reader app detected: " +
                    payload.getOrDefault("packageName", "unknown");
            case ERP_BRUTEFORCE -> "ERP brute-force attempt: " +
                    payload.getOrDefault("requestCount", "?") + " requests in " +
                    payload.getOrDefault("windowSecs", "?") + "s";
            case FIM_CHANGE -> "File integrity change: " +
                    payload.getOrDefault("filePath", "unknown") + " (" +
                    payload.getOrDefault("changeType", "MODIFY") + ")";
            case PROCESS_ANOMALY -> "Suspicious process: " +
                    payload.getOrDefault("processName", "unknown") + " (PID " +
                    payload.getOrDefault("pid", "?") + ")";
            case PORT_SCAN -> "Port scan behavior: " +
                    payload.getOrDefault("uniqueDestIPs", "?") + " unique IPs in " +
                    payload.getOrDefault("windowSecs", "?") + "s";
            case MALICIOUS_IP -> "Connection to malicious IP: " +
                    payload.getOrDefault("destinationIp", "unknown") + " (abuse score: " +
                    payload.getOrDefault("abuseScore", "?") + ")";
        };
    }

    private int severityOrdinal(Severity severity) {
        return switch (severity) {
            case CRITICAL -> 0;
            case HIGH -> 1;
            case MEDIUM -> 2;
            case LOW -> 3;
            case INFO -> 4;
        };
    }
}
