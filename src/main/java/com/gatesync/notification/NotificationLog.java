package com.gatesync.notification;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "notification_logs",
    indexes = {
        @Index(name = "idx_notification_visitor", columnList = "visitorRequestId"),
        @Index(name = "idx_notification_resident", columnList = "residentId")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long visitorRequestId;

    private Long residentId;

    private String targetFlat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    private String providerMessageId;

    private String recipientMasked;

    @Column(length = 1000)
    private String failureReason;

    @Builder.Default
    private int attemptCount = 1;

    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
