package com.gatesync.notification;

import com.gatesync.dto.VisitorDtos.NotificationEvent;
import com.gatesync.model.User;
import com.gatesync.model.VisitorRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SmsProvider smsProvider;
    private final NotificationLogRepository notificationLogRepository;

    @Transactional
    public void notifyResidentOfVisitor(VisitorRequest request, User residentUser) {
        // 1. WebSocket Broadcast
        sendWebSocketNotification(request);

        // 2. Immediate SMS fallback if user phone is available
        String phone = (residentUser != null && residentUser.getPhone() != null && !residentUser.getPhone().isBlank())
                ? residentUser.getPhone()
                : request.getVisitorPhone(); // Fallback phone check

        if (phone != null && !phone.isBlank()) {
            sendSmsOnce(request, phone, residentUser != null ? residentUser.getId() : null, NotificationPurpose.VISITOR_REQUEST);
        }
    }

    public void sendWebSocketNotification(VisitorRequest request) {
        String block = request.getTargetBlock() != null ? request.getTargetBlock() : "A";
        String flat = request.getTargetFlat() != null ? request.getTargetFlat() : "101";

        String residentDestination = "/topic/resident/" + block + "-" + flat;
        String guardDestination = "/topic/guard/queue";

        NotificationEvent event = NotificationEvent.builder()
                .type("VISITOR_NEW")
                .requestId(request.getId())
                .visitorName(request.getVisitorName())
                .purpose(request.getPurpose())
                .photoUrl(request.getPhotoUrl())
                .targetBlock(request.getTargetBlock())
                .targetFlat(request.getTargetFlat())
                .status(request.getStatus())
                .timestamp(request.getCreatedAt())
                .build();

        try {
            messagingTemplate.convertAndSend(residentDestination, event);
            messagingTemplate.convertAndSend(guardDestination, event);

            saveLog(
                request,
                null,
                NotificationChannel.WEB_SOCKET,
                NotificationPurpose.VISITOR_REQUEST,
                NotificationStatus.SENT,
                "ws-" + request.getId(),
                null
            );
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket notification: {}", e.getMessage());
            saveLog(
                request,
                null,
                NotificationChannel.WEB_SOCKET,
                NotificationPurpose.VISITOR_REQUEST,
                NotificationStatus.FAILED,
                null,
                e.getMessage()
            );
        }
    }

    @Transactional
    public void sendSmsOnce(
            VisitorRequest request,
            String phoneNumber,
            Long residentId,
            NotificationPurpose purpose
    ) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            saveLog(
                request,
                residentId,
                NotificationChannel.SMS,
                purpose,
                NotificationStatus.SKIPPED,
                null,
                "Resident phone number is missing"
            );
            return;
        }

        boolean alreadySent = notificationLogRepository.existsByVisitorRequestIdAndChannelAndPurposeAndStatusIn(
                request.getId(),
                NotificationChannel.SMS,
                purpose,
                List.of(NotificationStatus.QUEUED, NotificationStatus.SENT, NotificationStatus.DELIVERED)
        );

        if (alreadySent) {
            return;
        }

        SmsSendResult result = (purpose == NotificationPurpose.REMINDER)
                ? smsProvider.sendReminder(phoneNumber, request)
                : smsProvider.sendVisitorAlert(phoneNumber, request);

        saveLog(
            request,
            residentId,
            NotificationChannel.SMS,
            purpose,
            result.accepted() ? NotificationStatus.SENT : NotificationStatus.FAILED,
            result.providerMessageId(),
            result.failureReason()
        );
    }

    private void saveLog(
            VisitorRequest request,
            Long residentId,
            NotificationChannel channel,
            NotificationPurpose purpose,
            NotificationStatus status,
            String providerMessageId,
            String failureReason
    ) {
        NotificationLog notificationLog = NotificationLog.builder()
                .visitorRequestId(request.getId())
                .residentId(residentId)
                .targetFlat((request.getTargetBlock() != null ? request.getTargetBlock() : "A") + "-" + request.getTargetFlat())
                .channel(channel)
                .purpose(purpose)
                .status(status)
                .providerMessageId(providerMessageId)
                .failureReason(failureReason)
                .attemptCount(1)
                .sentAt(status == NotificationStatus.SENT ? LocalDateTime.now() : null)
                .build();

        notificationLogRepository.save(notificationLog);
    }
}
