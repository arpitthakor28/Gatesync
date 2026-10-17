package com.societysync.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "notifications")
@CompoundIndexes({
        @CompoundIndex(name = "idx_recipient_status_created", def = "{'recipientUserId': 1, 'status': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_society_created", def = "{'societyId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_society_flat_status", def = "{'societyId': 1, 'flatNumber': 1, 'status': 1}")
})
@Getter
@Setter
@NoArgsConstructor
public class NotificationDocument {

    @Id
    private String id;

    @Indexed
    private String societyId;

    @Indexed
    private Long recipientUserId;

    private String recipientLoginId;

    private String flatNumber;

    private NotificationType type;

    private NotificationPriority priority = NotificationPriority.NORMAL;

    private String title;

    private String body;

    private Map<String, Object> payload;

    private NotificationStatus status = NotificationStatus.CREATED;

    private List<String> channelsAttempted = new ArrayList<>();

    @Indexed(unique = true, sparse = true)
    private String dedupeKey;

    private Instant createdAt = Instant.now();
    private Instant sentAt;
    private Instant deliveredAt;
    private Instant seenAt;
    private Instant actedAt;
    private Instant expiredAt;
    private Instant failedAt;

    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;

    public enum NotificationType {
        VISITOR_REQUEST,
        VISITOR_APPROVED,
        VISITOR_REJECTED,
        VISITOR_NO_RESPONSE,
        PREAPPROVED_ARRIVED,
        DELIVERY_AT_GATE,
        VISITOR_EXIT,
        SOS_ALERT,
        ADMIN_NOTICE
    }

    public enum NotificationPriority {
        CRITICAL,
        HIGH,
        NORMAL
    }

    public enum NotificationStatus {
        CREATED,
        SENT,
        DELIVERED,
        SEEN,
        ACTED,
        EXPIRED,
        FAILED
    }
}
