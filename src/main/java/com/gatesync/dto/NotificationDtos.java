package com.gatesync.dto;

import com.gatesync.notification.NotificationChannel;
import com.gatesync.notification.NotificationPurpose;
import com.gatesync.notification.NotificationStatus;
import lombok.*;

import java.time.LocalDateTime;

public class NotificationDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationPreferencesRequest {
        private boolean visitorPopupEnabled;
        private boolean soundAlertEnabled;
        private boolean browserNotificationEnabled;
        private boolean smsEnabled;
        private boolean whatsappEnabled;
        private String primaryPhone;
        private String backupPhone;
        private boolean smsImmediately;
        private Integer fallbackAfterSeconds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationPreferencesResponse {
        private boolean visitorPopupEnabled;
        private boolean soundAlertEnabled;
        private boolean browserNotificationEnabled;
        private boolean smsEnabled;
        private boolean whatsappEnabled;
        private String primaryPhone;
        private String backupPhone;
        private boolean smsImmediately;
        private Integer fallbackAfterSeconds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationStatusResponse {
        private Long notificationId;
        private Long visitorRequestId;
        private NotificationChannel channel;
        private NotificationPurpose purpose;
        private NotificationStatus status;
        private String recipientMasked;
        private LocalDateTime sentAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmergencyAlertRequest {
        private String emergencyType; // MEDICAL, FIRE, SECURITY, GATE_DISTURBANCE, GENERAL
        private String callerName;
        private String callerRole;
        private String callerPhone;
        private String blockNumber;
        private String flatNumber;
        private String gateName;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmergencyAlertResponse {
        private Long id;
        private String emergencyType;
        private String callerName;
        private String callerRole;
        private String callerPhone;
        private String blockNumber;
        private String flatNumber;
        private String gateName;
        private String note;
        private String status;
        private String acknowledgedBy;
        private LocalDateTime acknowledgedAt;
        private String resolvedBy;
        private LocalDateTime resolvedAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnnouncementRequest {
        private String title;
        private String message;
        private String category;
        private String priority;
        private String targetRole; // ALL, RESIDENT, GUARD, ADMIN
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UniversalNotificationEvent {
        private String type; // VISITOR_NEW, VISITOR_UPDATE, EMERGENCY_SOS, COMPLAINT_NEW, COMPLAINT_UPDATE, BOOKING_NEW, BOOKING_UPDATE, ANNOUNCEMENT
        private Long id;
        private String title;
        private String message;
        private String category;
        private String priority;
        private Object payload;
        private LocalDateTime timestamp;
    }
}
