package com.societysync.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import com.societysync.mongo.document.DeviceFcmToken;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.repository.DeviceFcmTokenRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FirebaseService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseService.class);

    private final DeviceFcmTokenRepository tokenRepository;

    @Value("${firebase.config.path:}")
    private String firebaseConfigPath;

    @Value("${firebase.project-id:gatesync-pwa}")
    private String projectId;

    private boolean initialized = false;

    public FirebaseService(DeviceFcmTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) {
            initialized = true;
            return;
        }

        try {
            InputStream serviceAccount = null;

            // 1. Check direct JSON string env var (recommended for Render & CI)
            String envJson = System.getenv("FIREBASE_CREDENTIALS_JSON");
            if (envJson != null && !envJson.isBlank()) {
                serviceAccount = new ByteArrayInputStream(envJson.getBytes(StandardCharsets.UTF_8));
                log.info("[FirebaseService] Initializing via FIREBASE_CREDENTIALS_JSON env var");
            } else if (firebaseConfigPath != null && !firebaseConfigPath.isBlank()) {
                // 2. Check local file path if provided
                serviceAccount = new FileInputStream(firebaseConfigPath);
                log.info("[FirebaseService] Initializing via file path: {}", firebaseConfigPath);
            }

            if (serviceAccount != null) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setProjectId(projectId)
                        .build();

                FirebaseApp.initializeApp(options);
                initialized = true;
                log.info("[FirebaseService] Firebase Admin SDK (HTTP v1) initialized successfully");
            } else {
                log.warn("[FirebaseService] No Firebase credentials found. Running in simulation mode for FCM Web Push.");
            }
        } catch (Exception e) {
            log.error("[FirebaseService] Failed to initialize Firebase Admin SDK: {}", e.getMessage());
            initialized = false;
        }
    }

    public boolean isInitialized() {
        return initialized;
    }

    /**
     * Dispatches Web Push via FCM HTTP v1 API to all tokens of the recipient
     */
    public int sendWebPush(List<DeviceFcmToken> tokens, NotificationDocument notification) {
        if (tokens == null || tokens.isEmpty()) {
            return 0;
        }

        int successCount = 0;
        String collapseTag = notification.getPayload() != null && notification.getPayload().containsKey("requestId")
                ? "gate_visitor_" + notification.getPayload().get("requestId")
                : "gatesync_" + notification.getType();

        long ttlSeconds = notification.getType() == NotificationDocument.NotificationType.SOS_ALERT ? 300L : 120L;
        String urgency = (notification.getPriority() == NotificationDocument.NotificationPriority.CRITICAL ||
                notification.getPriority() == NotificationDocument.NotificationPriority.HIGH) ? "high" : "normal";

        for (DeviceFcmToken deviceToken : tokens) {
            boolean sent = sendToSingleTokenWithRetry(deviceToken, notification, collapseTag, ttlSeconds, urgency);
            if (sent) {
                successCount++;
            }
        }

        return successCount;
    }

    private boolean sendToSingleTokenWithRetry(DeviceFcmToken deviceToken,
                                                NotificationDocument notification,
                                                String collapseTag,
                                                long ttlSeconds,
                                                String urgency) {
        String token = deviceToken.getFcmToken();
        int attempts = 0;
        long backoffMs = 500;

        while (attempts < 3) {
            attempts++;
            if (!initialized) {
                // Local dev / simulation mode
                log.info("[FirebaseService - SIMULATION] Web Push to device {} (token: {}...): title='{}', body='{}'",
                        deviceToken.getDeviceName(),
                        token.substring(0, Math.min(token.length(), 10)),
                        notification.getTitle(),
                        notification.getBody());
                return true;
            }

            try {
                Map<String, String> dataPayload = new HashMap<>();
                dataPayload.put("notificationId", notification.getId() != null ? notification.getId() : "");
                dataPayload.put("type", notification.getType().name());
                dataPayload.put("priority", notification.getPriority().name());
                dataPayload.put("societyId", notification.getSocietyId());
                if (notification.getFlatNumber() != null) {
                    dataPayload.put("flatNumber", notification.getFlatNumber());
                }

                if (notification.getPayload() != null) {
                    notification.getPayload().forEach((k, v) -> {
                        if (v != null) dataPayload.put(k, String.valueOf(v));
                    });
                }

                WebpushNotification.Builder webpushNotifBuilder = WebpushNotification.builder()
                        .setTitle(notification.getTitle())
                        .setBody(notification.getBody())
                        .setIcon("/Gatesync/icons/icon-192.png")
                        .setBadge("/Gatesync/icons/icon-192.png")
                        .setTag(collapseTag);

                if (notification.getPayload() != null && notification.getPayload().get("visitorPhotoUrl") != null) {
                    webpushNotifBuilder.setImage(String.valueOf(notification.getPayload().get("visitorPhotoUrl")));
                }

                // Add interactive action buttons for VISITOR_REQUEST
                if (notification.getType() == NotificationDocument.NotificationType.VISITOR_REQUEST) {
                    webpushNotifBuilder.addAction(new WebpushNotification.Action("approve", "Approve Entry"));
                    webpushNotifBuilder.addAction(new WebpushNotification.Action("reject", "Deny"));
                }

                WebpushConfig webpushConfig = WebpushConfig.builder()
                        .putHeader("TTL", String.valueOf(ttlSeconds))
                        .putHeader("Urgency", urgency)
                        .putHeader("Topic", collapseTag)
                        .setNotification(webpushNotifBuilder.build())
                        .putAllData(dataPayload)
                        .build();

                Message msg = Message.builder()
                        .setToken(token)
                        .setWebpushConfig(webpushConfig)
                        .putAllData(dataPayload)
                        .build();

                String messageId = FirebaseMessaging.getInstance().send(msg);
                log.info("[FirebaseService] FCM HTTP v1 Push delivered successfully. messageId={}, device={}",
                        messageId, deviceToken.getDeviceName());
                return true;

            } catch (FirebaseMessagingException e) {
                MessagingErrorCode errorCode = e.getMessagingErrorCode();
                log.warn("[FirebaseService] FCM error (attempt {}/3) for token {}: {} (code: {})",
                        attempts, token.substring(0, Math.min(token.length(), 10)), e.getMessage(), errorCode);

                // If token is permanently unregistered or invalid, clean it up immediately
                if (errorCode == MessagingErrorCode.UNREGISTERED ||
                    errorCode == MessagingErrorCode.INVALID_ARGUMENT) {
                    log.info("[FirebaseService] Removing stale/unregistered token from database: {}", token);
                    tokenRepository.deleteByFcmToken(token);
                    return false;
                }

                // Transient failure: retry with exponential backoff
                if (attempts < 3) {
                    try {
                        Thread.sleep(backoffMs);
                        backoffMs *= 2;
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            } catch (Exception ex) {
                log.error("[FirebaseService] Unexpected error sending push: {}", ex.getMessage());
                return false;
            }
        }

        return false;
    }
}
