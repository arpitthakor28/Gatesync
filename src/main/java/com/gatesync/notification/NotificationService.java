package com.gatesync.notification;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.NotificationDtos.*;
import com.gatesync.dto.VisitorDtos.NotificationEvent;
import com.gatesync.model.*;
import com.gatesync.repository.mongo.NotificationMongoRepository;
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
    private final NotificationMongoRepository notificationMongoRepository;
    private final MongoSequenceService sequenceService;

    @Transactional
    public void notifyResidentOfVisitor(VisitorRequest request, User residentUser) {
        // 1. WebSocket Broadcast
        sendWebSocketNotification(request);

        // 2. Persistent In-App Notification
        createVisitorNotification(request, residentUser);

        // 3. Immediate SMS fallback if user phone is available
        String phone = (residentUser != null && residentUser.getPhone() != null && !residentUser.getPhone().isBlank())
                ? residentUser.getPhone()
                : request.getVisitorPhone();

        if (phone != null && !phone.isBlank()) {
            sendSmsOnce(request, phone, residentUser != null ? residentUser.getId() : null, NotificationPurpose.VISITOR_REQUEST);
        }
    }

    public void createVisitorNotification(VisitorRequest request, User residentUser) {
        try {
            String block = request.getTargetBlock() != null ? request.getTargetBlock() : "A";
            String flat = request.getTargetFlat() != null ? request.getTargetFlat() : "101";

            Notification notification = Notification.builder()
                    .id(sequenceService.nextId("notifications"))
                    .targetUserId(residentUser != null ? residentUser.getId() : null)
                    .targetRole("RESIDENT")
                    .targetFlat(block + "-" + flat)
                    .title("🔔 Visitor Arrival: " + request.getVisitorName())
                    .message("Visitor " + request.getVisitorName() + " (" + (request.getPurpose() != null ? request.getPurpose() : "Guest") + ") has arrived at " + (request.getGateName() != null ? request.getGateName() : "Main Gate") + ".")
                    .category(NotificationCategory.VISITOR)
                    .priority(NotificationPriority.HIGH)
                    .isRead(false)
                    .actionUrl("/resident/visitor/" + request.getId())
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationMongoRepository.save(notification);
        } catch (Exception e) {
            log.warn("Failed to persist in-app notification: {}", e.getMessage());
        }
    }

    public void sendWebSocketNotification(VisitorRequest request) {
        String block = request.getTargetBlock() != null ? request.getTargetBlock() : "A";
        String flat = request.getTargetFlat() != null ? request.getTargetFlat() : "101";

        String residentDestination = "/topic/resident/" + block + "-" + flat;
        String guardDestination = "/topic/guard/queue";
        String broadcastDestination = "/topic/society/broadcast";

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
            messagingTemplate.convertAndSend(broadcastDestination, event);

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

    public void broadcastEmergencyAlert(EmergencyAlert alert) {
        UniversalNotificationEvent event = UniversalNotificationEvent.builder()
                .type("EMERGENCY_SOS")
                .id(alert.getId())
                .title("🚨 EMERGENCY SOS ALERT!")
                .message("Panic alert triggered by " + alert.getCallerName() + " (" + alert.getEmergencyType() + ") at " + (alert.getBlockNumber() != null ? "Flat " + alert.getBlockNumber() + "-" + alert.getFlatNumber() : alert.getGateName()))
                .category(NotificationCategory.EMERGENCY_SOS.name())
                .priority(NotificationPriority.CRITICAL.name())
                .payload(alert)
                .timestamp(LocalDateTime.now())
                .build();

        try {
            // Save persistent notifications for Guards & Admins
            Notification notification = Notification.builder()
                    .id(sequenceService.nextId("notifications"))
                    .targetRole("ALL")
                    .title("🚨 EMERGENCY SOS: " + alert.getEmergencyType())
                    .message(event.getMessage())
                    .category(NotificationCategory.EMERGENCY_SOS)
                    .priority(NotificationPriority.CRITICAL)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationMongoRepository.save(notification);

            // Broadcast on emergency dedicated STOMP channel & broadcast
            messagingTemplate.convertAndSend("/topic/emergency/sos", event);
            messagingTemplate.convertAndSend("/topic/society/broadcast", event);
            messagingTemplate.convertAndSend("/topic/role/GUARD", event);
            messagingTemplate.convertAndSend("/topic/role/ADMIN", event);
        } catch (Exception e) {
            log.error("Failed to broadcast emergency SOS event: {}", e.getMessage());
        }
    }

    public void broadcastAnnouncement(AnnouncementRequest req, String senderName) {
        try {
            Notification notification = Notification.builder()
                    .id(sequenceService.nextId("notifications"))
                    .targetRole(req.getTargetRole() != null ? req.getTargetRole() : "ALL")
                    .title("📢 " + req.getTitle())
                    .message(req.getMessage())
                    .category(NotificationCategory.ANNOUNCEMENT)
                    .priority(NotificationPriority.HIGH)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationMongoRepository.save(notification);

            UniversalNotificationEvent event = UniversalNotificationEvent.builder()
                    .type("ANNOUNCEMENT")
                    .id(notification.getId())
                    .title(notification.getTitle())
                    .message(notification.getMessage())
                    .category(NotificationCategory.ANNOUNCEMENT.name())
                    .priority(NotificationPriority.HIGH.name())
                    .payload(req)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/society/broadcast", event);
        } catch (Exception e) {
            log.error("Failed to send announcement broadcast: {}", e.getMessage());
        }
    }

    public void createCategoryNotification(String title, String message, NotificationCategory category, NotificationPriority priority, String targetRole, String targetFlat) {
        try {
            Notification notification = Notification.builder()
                    .id(sequenceService.nextId("notifications"))
                    .targetRole(targetRole != null ? targetRole : "ALL")
                    .targetFlat(targetFlat)
                    .title(title)
                    .message(message)
                    .category(category)
                    .priority(priority)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationMongoRepository.save(notification);

            UniversalNotificationEvent event = UniversalNotificationEvent.builder()
                    .type(category.name() + "_EVENT")
                    .id(notification.getId())
                    .title(title)
                    .message(message)
                    .category(category.name())
                    .priority(priority.name())
                    .payload(notification)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/society/broadcast", event);
            if (targetFlat != null) {
                messagingTemplate.convertAndSend("/topic/resident/" + targetFlat, event);
            }
        } catch (Exception e) {
            log.warn("Failed to create category notification: {}", e.getMessage());
        }
    }

    public List<Notification> getAllNotifications() {
        return notificationMongoRepository.findAllByOrderByCreatedAtDesc();
    }

    public void markAsRead(Long notificationId) {
        notificationMongoRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationMongoRepository.save(n);
        });
    }

    public void markAllAsRead() {
        List<Notification> list = notificationMongoRepository.findAll();
        list.forEach(n -> {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        notificationMongoRepository.saveAll(list);
    }

    public void clearAll() {
        notificationMongoRepository.deleteAll();
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
