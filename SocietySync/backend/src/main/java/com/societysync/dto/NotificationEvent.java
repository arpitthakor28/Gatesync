package com.societysync.dto;

import com.societysync.mongo.document.NotificationDocument;

import java.time.Instant;
import java.util.Map;

public record NotificationEvent(
        String societyId,
        Long recipientUserId,
        String recipientLoginId,
        String flatNumber,
        NotificationDocument.NotificationType type,
        NotificationDocument.NotificationPriority priority,
        String title,
        String body,
        Map<String, Object> payload,
        String dedupeKey,
        Instant expiresAt
) {
}
