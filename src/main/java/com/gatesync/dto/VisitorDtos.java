package com.gatesync.dto;

import com.gatesync.model.VisitorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

public class VisitorDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitorRegistrationRequest {
        private String visitorName;
        private String visitorPhone;
        private String purpose;
        private String vehicleNumber;
        private String photoUrl;
        private String targetBlock;
        private String targetFlat;
        private String gateName;
        private String guardName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalDecisionRequest {
        private Long requestId;
        private VisitorStatus status; // APPROVED or DENIED
        private String denialReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreApprovePassRequest {
        private String guestName;
        private String guestPhone;
        private String category;
        private String residentFlat;
        private String residentName;
        private int validHours;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationEvent {
        private String type; // VISITOR_NEW, VISITOR_UPDATE, PASS_CREATED
        private Long requestId;
        private String visitorName;
        private String purpose;
        private String photoUrl;
        private String targetBlock;
        private String targetFlat;
        private VisitorStatus status;
        private LocalDateTime timestamp;
    }
}
