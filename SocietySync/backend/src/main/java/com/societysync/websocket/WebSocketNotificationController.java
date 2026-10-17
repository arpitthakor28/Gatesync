package com.societysync.websocket;

import com.societysync.mongo.document.NotificationDocument;
import com.societysync.security.UserPrincipal;
import com.societysync.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketNotificationController {

    private static final Logger log = LoggerFactory.getLogger(WebSocketNotificationController.class);

    private final NotificationService notificationService;

    public WebSocketNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Handles STOMP ACK from client: /app/notifications/ack
     */
    @MessageMapping("/notifications/ack")
    public void handleClientAck(@Payload Map<String, String> payload, @AuthenticationPrincipal UserPrincipal principal) {
        String notificationId = payload.get("notificationId");
        String statusStr = payload.getOrDefault("status", "DELIVERED");

        if (notificationId != null && !notificationId.isBlank()) {
            NotificationDocument.NotificationStatus status = NotificationDocument.NotificationStatus.valueOf(statusStr);
            Long userId = principal != null ? principal.getUserId() : 0L;
            notificationService.acknowledge(notificationId, status, userId);
            log.info("[WebSocket] Handled client STOMP ACK for notif={}, status={}", notificationId, status);
        }
    }
}
