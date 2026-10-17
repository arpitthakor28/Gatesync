package com.societysync.service;

import com.societysync.dto.NotificationEvent;
import com.societysync.mongo.document.DeviceFcmToken;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.document.NotificationPreferenceDocument;
import com.societysync.mongo.repository.DeviceFcmTokenRepository;
import com.societysync.mongo.repository.NotificationMongoRepository;
import com.societysync.mongo.repository.NotificationPreferenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationMongoRepository notificationRepository;
    private final DeviceFcmTokenRepository deviceTokenRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FirebaseService firebaseService;
    private final NotificationService self; // For self-invocation of @Async method

    public NotificationService(NotificationMongoRepository notificationRepository,
                               DeviceFcmTokenRepository deviceTokenRepository,
                               NotificationPreferenceRepository preferenceRepository,
                               SimpMessagingTemplate messagingTemplate,
                               FirebaseService firebaseService,
                               @Lazy NotificationService self) {
        this.notificationRepository = notificationRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.preferenceRepository = preferenceRepository;
        this.messagingTemplate = messagingTemplate;
        this.firebaseService = firebaseService;
        this.self = self;
    }

    /**
     * Single entry point for all notifications.
     * Persists first, then triggers async two-channel delivery pipeline with STOMP/FCM dedupe.
     */
    public NotificationDocument dispatch(NotificationEvent event) {
        // 1. Deduplication check
        if (event.dedupeKey() != null && !event.dedupeKey().isBlank()) {
            Optional<NotificationDocument> existing = notificationRepository.findByDedupeKey(event.dedupeKey());
            if (existing.isPresent()) {
                log.info("[NotificationService] DedupeKey match found: {}. Skipping duplicate dispatch.", event.dedupeKey());
                return existing.get();
            }
        }

        // 2. Persist Document in MongoDB
        NotificationDocument doc = new NotificationDocument();
        doc.setSocietyId(event.societyId() != null ? event.societyId() : "SOC-101");
        doc.setRecipientUserId(event.recipientUserId());
        doc.setRecipientLoginId(event.recipientLoginId());
        doc.setFlatNumber(event.flatNumber());
        doc.setType(event.type());
        doc.setPriority(event.priority() != null ? event.priority() : NotificationDocument.NotificationPriority.NORMAL);
        doc.setTitle(event.title());
        doc.setBody(event.body());
        doc.setPayload(event.payload());
        doc.setDedupeKey(event.dedupeKey());
        doc.setStatus(NotificationDocument.NotificationStatus.CREATED);
        doc.setCreatedAt(Instant.now());

        Instant expiry = event.expiresAt() != null
                ? event.expiresAt()
                : Instant.now().plus(event.type() == NotificationDocument.NotificationType.SOS_ALERT ? 300 : 120, ChronoUnit.SECONDS);
        doc.setExpiresAt(expiry);

        NotificationDocument saved = notificationRepository.save(doc);
        log.info("[NotificationService] Notification persisted id={}, type={}, dedupeKey={}",
                saved.getId(), saved.getType(), saved.getDedupeKey());

        // 3. Trigger Asynchronous Delivery Pipeline
        self.deliverAsync(saved.getId());

        return saved;
    }

    /**
     * Asynchronous two-channel delivery:
     * Channel 1: STOMP (immediate)
     * 2-second STOMP ACK window
     * Channel 2: FCM Web Push fallback (if not ACKed)
     */
    @Async("notificationExecutor")
    public void deliverAsync(String notificationId) {
        Optional<NotificationDocument> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) return;
        NotificationDocument notif = opt.get();

        boolean stompAttempted = false;

        try {
            // Channel 1: STOMP to /user/queue/notifications and topic channels
            if (notif.getRecipientLoginId() != null && !notif.getRecipientLoginId().isBlank()) {
                messagingTemplate.convertAndSendToUser(
                        notif.getRecipientLoginId(),
                        "/queue/notifications",
                        notif
                );
                stompAttempted = true;
            }

            // Also broadcast on flat topic channel
            if (notif.getFlatNumber() != null && notif.getSocietyId() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/society/" + notif.getSocietyId() + "/flat/" + notif.getFlatNumber(),
                        notif
                );
                stompAttempted = true;
            }

            // If SOS or VISITOR_DECISION, also broadcast to guards
            if (notif.getType() == NotificationDocument.NotificationType.SOS_ALERT ||
                notif.getType() == NotificationDocument.NotificationType.VISITOR_APPROVED ||
                notif.getType() == NotificationDocument.NotificationType.VISITOR_REJECTED ||
                notif.getType() == NotificationDocument.NotificationType.VISITOR_NO_RESPONSE) {
                messagingTemplate.convertAndSend(
                        "/topic/society/" + notif.getSocietyId() + "/guards",
                        notif
                );
                stompAttempted = true;
            }

            if (stompAttempted) {
                notif.getChannelsAttempted().add("STOMP");
                notif.setStatus(NotificationDocument.NotificationStatus.SENT);
                notif.setSentAt(Instant.now());
                notif = notificationRepository.save(notif);
                log.info("[NotificationService] Dispatched via STOMP: id={}", notificationId);
            }

            // Deduplication Window: wait 2 seconds for STOMP client ACK
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // Check if client already acknowledged delivery over STOMP
            Optional<NotificationDocument> refreshed = notificationRepository.findById(notificationId);
            if (refreshed.isPresent()) {
                notif = refreshed.get();
                if (notif.getStatus() == NotificationDocument.NotificationStatus.DELIVERED ||
                    notif.getStatus() == NotificationDocument.NotificationStatus.SEEN ||
                    notif.getStatus() == NotificationDocument.NotificationStatus.ACTED) {
                    log.info("[NotificationService] Client acknowledged over STOMP within 2s (status={}). Skipping FCM Web Push dedupe.",
                            notif.getStatus());
                    return;
                }
            }

            // Channel 2: FCM Web Push Fallback (client is in background or offline)
            List<DeviceFcmToken> tokens = null;
            if (notif.getRecipientUserId() != null && notif.getRecipientUserId() > 0) {
                tokens = deviceTokenRepository.findByUserId(notif.getRecipientUserId());
            } else if (notif.getFlatNumber() != null && notif.getSocietyId() != null) {
                tokens = deviceTokenRepository.findBySocietyIdAndFlatNumber(notif.getSocietyId(), notif.getFlatNumber());
            }

            // If SOS alert, also send push to ALL guards in the society
            if (notif.getType() == NotificationDocument.NotificationType.SOS_ALERT) {
                List<DeviceFcmToken> guardTokens = deviceTokenRepository.findBySocietyIdAndRole(notif.getSocietyId(), "GUARD");
                if (guardTokens != null && !guardTokens.isEmpty()) {
                    tokens = tokens != null ? tokens : new java.util.ArrayList<>();
                    tokens.addAll(guardTokens);
                }
            }

            if (tokens != null && !tokens.isEmpty()) {
                // Check Quiet Hours (CRITICAL and SOS always bypass)
                if (shouldBypassQuietHours(notif) || !isQuietHourActive(notif.getRecipientUserId())) {
                    log.info("[NotificationService] STOMP not ACKed. Falling back to FCM Web Push ({} tokens)", tokens.size());
                    int pushed = firebaseService.sendWebPush(tokens, notif);
                    if (pushed > 0) {
                        notif.getChannelsAttempted().add("FCM_PUSH");
                        notif = notificationRepository.save(notif);
                    }
                } else {
                    log.info("[NotificationService] Quiet hours active for user {}. Suppressed non-critical FCM push.", notif.getRecipientUserId());
                }
            } else {
                log.info("[NotificationService] No FCM device tokens found for recipient user {}", notif.getRecipientUserId());
            }

            // If both channels failed or nothing reached
            if (notif.getChannelsAttempted().isEmpty()) {
                notif.setStatus(NotificationDocument.NotificationStatus.FAILED);
                notif.setFailedAt(Instant.now());
                notificationRepository.save(notif);

                // Alert guard screen that notification could not be delivered
                messagingTemplate.convertAndSend(
                        "/topic/society/" + notif.getSocietyId() + "/guards",
                        java.util.Map.of(
                                "alert", "DELIVERY_FAILED",
                                "notificationId", notificationId,
                                "flatNumber", notif.getFlatNumber() != null ? notif.getFlatNumber() : "Unknown",
                                "message", "Resident could not be reached via STOMP or Web Push"
                        )
                );
            }

        } catch (Exception e) {
            log.error("[NotificationService] Exception during async delivery: {}", e.getMessage(), e);
            notif.setStatus(NotificationDocument.NotificationStatus.FAILED);
            notif.setFailedAt(Instant.now());
            notificationRepository.save(notif);
        }
    }

    /**
     * Client ACK to transition state to DELIVERED, SEEN, or ACTED
     */
    public NotificationDocument acknowledge(String notificationId, NotificationDocument.NotificationStatus status, Long userId) {
        NotificationDocument notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Notification not found: " + notificationId));

        if (status == NotificationDocument.NotificationStatus.DELIVERED) {
            notif.setStatus(NotificationDocument.NotificationStatus.DELIVERED);
            if (notif.getDeliveredAt() == null) notif.setDeliveredAt(Instant.now());
        } else if (status == NotificationDocument.NotificationStatus.SEEN) {
            notif.setStatus(NotificationDocument.NotificationStatus.SEEN);
            if (notif.getSeenAt() == null) notif.setSeenAt(Instant.now());
        } else if (status == NotificationDocument.NotificationStatus.ACTED) {
            notif.setStatus(NotificationDocument.NotificationStatus.ACTED);
            if (notif.getActedAt() == null) notif.setActedAt(Instant.now());
        }

        NotificationDocument updated = notificationRepository.save(notif);
        log.info("[NotificationService] ACK updated notificationId={}, newStatus={}", notificationId, status);
        return updated;
    }

    private boolean shouldBypassQuietHours(NotificationDocument notif) {
        return notif.getPriority() == NotificationDocument.NotificationPriority.CRITICAL ||
               notif.getType() == NotificationDocument.NotificationType.SOS_ALERT;
    }

    private boolean isQuietHourActive(Long userId) {
        if (userId == null) return false;
        Optional<NotificationPreferenceDocument> prefOpt = preferenceRepository.findByUserId(userId);
        if (prefOpt.isEmpty()) return false;
        NotificationPreferenceDocument pref = prefOpt.get();
        if (!pref.isQuietHoursEnabled()) return false;

        try {
            LocalTime now = LocalTime.now();
            LocalTime start = LocalTime.parse(pref.getQuietHoursStart());
            LocalTime end = LocalTime.parse(pref.getQuietHoursEnd());

            if (start.isBefore(end)) {
                return !now.isBefore(start) && now.isBefore(end);
            } else {
                // Crosses midnight, e.g. 22:00 to 07:00
                return !now.isBefore(start) || now.isBefore(end);
            }
        } catch (Exception e) {
            return false;
        }
    }
}
