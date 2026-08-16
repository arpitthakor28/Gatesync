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
}
