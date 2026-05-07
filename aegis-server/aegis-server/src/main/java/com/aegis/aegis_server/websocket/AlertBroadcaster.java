package com.aegis.aegis_server.websocket;

import com.aegis.aegis_server.dto.WebSocketAlertMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a new alert to all subscribed admin dashboard clients.
     */
    public void broadcastAlert(WebSocketAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/alerts", message);
        log.debug("Broadcasted alert: {} for device {}", message.getEventType(), message.getDeviceId());
    }

    /**
     * Broadcast a score update event.
     */
    public void broadcastScoreUpdate(WebSocketAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/scores", message);
        log.debug("Broadcasted score update for device {}", message.getDeviceId());
    }

    /**
     * Broadcast a device status change (online/offline).
     */
    public void broadcastDeviceStatus(WebSocketAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/devices", message);
        log.debug("Broadcasted device status for {}", message.getDeviceId());
    }

    /**
     * Broadcast a new Patient Zero cluster detection.
     */
    public void broadcastPatientZero(WebSocketAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/patient-zero", message);
        log.debug("Broadcasted Patient Zero cluster: {}", message.getEventType());
    }
}
