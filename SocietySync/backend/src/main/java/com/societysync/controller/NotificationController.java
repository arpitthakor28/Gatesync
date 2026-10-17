package com.societysync.controller;

import com.societysync.mongo.document.DeviceFcmToken;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.document.NotificationPreferenceDocument;
import com.societysync.mongo.repository.DeviceFcmTokenRepository;
import com.societysync.mongo.repository.NotificationMongoRepository;
import com.societysync.mongo.repository.NotificationPreferenceRepository;
import com.societysync.security.UserPrincipal;
import com.societysync.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMongoRepository notificationRepository;
    private final DeviceFcmTokenRepository deviceTokenRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationController(NotificationService notificationService,
                                  NotificationMongoRepository notificationRepository,
                                  DeviceFcmTokenRepository deviceTokenRepository,
                                  NotificationPreferenceRepository preferenceRepository) {
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.preferenceRepository = preferenceRepository;
    }

    // Client ACK to move status to DELIVERED, SEEN, or ACTED
    @PostMapping("/{id}/ack")
    public ResponseEntity<NotificationDocument> acknowledgeNotification(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String statusStr = body.getOrDefault("status", "DELIVERED");
        NotificationDocument.NotificationStatus status = NotificationDocument.NotificationStatus.valueOf(statusStr);
        NotificationDocument updated = notificationService.acknowledge(id, status, principal.getUserId());
        return ResponseEntity.ok(updated);
    }

    // Resync pending active notifications on app cold start or STOMP reconnect
    @GetMapping("/pending")
    public List<NotificationDocument> getPendingNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationRepository.findByRecipientUserIdAndStatusOrderByCreatedAtDesc(
                principal.getUserId(),
                NotificationDocument.NotificationStatus.SENT
        );
    }

    // Notification center list with optional type filter
    @GetMapping
    public Map<String, Object> getNotificationFeed(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<NotificationDocument> list;
        if (type != null && !type.isBlank()) {
            NotificationDocument.NotificationType notifType = NotificationDocument.NotificationType.valueOf(type.toUpperCase());
            list = notificationRepository.findByRecipientUserIdAndSocietyIdAndTypeOrderByCreatedAtDesc(
                    principal.getUserId(),
                    principal.getSocietyId(),
                    notifType,
                    PageRequest.of(page, size)
            );
        } else {
            list = notificationRepository.findByRecipientUserIdAndSocietyIdOrderByCreatedAtDesc(
                    principal.getUserId(),
                    principal.getSocietyId(),
                    PageRequest.of(page, size)
            );
        }

        long unreadCount = notificationRepository.countByRecipientUserIdAndStatus(
                principal.getUserId(),
                NotificationDocument.NotificationStatus.SENT
        );

        return Map.of(
                "notifications", list,
                "unreadCount", unreadCount,
                "page", page,
                "size", size
        );
    }

    // Register per-device FCM Push Token
    @PostMapping("/fcm-token")
    public ResponseEntity<Map<String, Object>> registerFcmToken(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        String token = body.get("fcmToken");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "fcmToken is required"));
        }

        String deviceName = body.getOrDefault("deviceName", "Web Browser PWA");

        Optional<DeviceFcmToken> existing = deviceTokenRepository.findByFcmToken(token);
        DeviceFcmToken entity = existing.orElseGet(DeviceFcmToken::new);
        entity.setFcmToken(token);
        entity.setUserId(principal.getUserId());
        entity.setLoginId(principal.getUsername());
        entity.setSocietyId(principal.getSocietyId());
        entity.setRole(principal.getRole());
        entity.setFlatNumber(principal.getFlatNumber());
        entity.setDeviceName(deviceName);
        entity.setUserAgent(userAgent);
        entity.setLastActiveAt(Instant.now());
        deviceTokenRepository.save(entity);

        return ResponseEntity.ok(Map.of("registered", true, "token", token));
    }

    // Unregister FCM Token on logout
    @DeleteMapping("/fcm-token")
    public ResponseEntity<Map<String, String>> unregisterFcmToken(@RequestBody Map<String, String> body) {
        String token = body.get("fcmToken");
        if (token != null && !token.isBlank()) {
            deviceTokenRepository.deleteByFcmToken(token);
        }
        return ResponseEntity.ok(Map.of("message", "FCM token unregistered successfully"));
    }

    // Get notification preferences
    @GetMapping("/preferences")
    public NotificationPreferenceDocument getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return preferenceRepository.findByUserId(principal.getUserId())
                .orElseGet(() -> {
                    NotificationPreferenceDocument doc = new NotificationPreferenceDocument();
                    doc.setUserId(principal.getUserId());
                    doc.setLoginId(principal.getUsername());
                    doc.setSocietyId(principal.getSocietyId());
                    return preferenceRepository.save(doc);
                });
    }

    // Update notification preferences
    @PutMapping("/preferences")
    public NotificationPreferenceDocument updatePreferences(
            @RequestBody NotificationPreferenceDocument updated,
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationPreferenceDocument existing = preferenceRepository.findByUserId(principal.getUserId())
                .orElseGet(() -> {
                    NotificationPreferenceDocument doc = new NotificationPreferenceDocument();
                    doc.setUserId(principal.getUserId());
                    doc.setLoginId(principal.getUsername());
                    doc.setSocietyId(principal.getSocietyId());
                    return doc;
                });

        existing.setSoundEnabled(updated.isSoundEnabled());
        existing.setVibrationEnabled(updated.isVibrationEnabled());
        existing.setQuietHoursEnabled(updated.isQuietHoursEnabled());
        existing.setQuietHoursStart(updated.getQuietHoursStart());
        existing.setQuietHoursEnd(updated.getQuietHoursEnd());
        existing.setAllowVisitors(updated.isAllowVisitors());
        existing.setAllowDeliveries(updated.isAllowDeliveries());
        existing.setAllowNotices(updated.isAllowNotices());
        existing.setUpdatedAt(Instant.now());

        return preferenceRepository.save(existing);
    }

    // Admin delivery log for audit & metrics
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/delivery-log")
    public List<NotificationDocument> getAdminDeliveryLog(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (status != null && !status.isBlank()) {
            NotificationDocument.NotificationStatus notifStatus = NotificationDocument.NotificationStatus.valueOf(status.toUpperCase());
            return notificationRepository.findBySocietyIdAndStatusOrderByCreatedAtDesc(
                    principal.getSocietyId(),
                    notifStatus,
                    PageRequest.of(page, size)
            );
        }
        return notificationRepository.findBySocietyIdOrderByCreatedAtDesc(
                principal.getSocietyId(),
                PageRequest.of(page, size)
        );
    }
}
