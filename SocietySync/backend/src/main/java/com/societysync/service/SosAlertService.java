package com.societysync.service;

import com.societysync.dto.NotificationEvent;
import com.societysync.mongo.document.AuditLogDocument;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.repository.AuditLogRepository;
import com.societysync.mongo.repository.NotificationMongoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SosAlertService {

    private static final Logger log = LoggerFactory.getLogger(SosAlertService.class);

    private final NotificationService notificationService;
    private final NotificationMongoRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SosAlertService(NotificationService notificationService,
                           NotificationMongoRepository notificationRepository,
                           AuditLogRepository auditLogRepository,
                           SimpMessagingTemplate messagingTemplate) {
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public NotificationDocument triggerSos(Long residentUserId,
                                           String residentLoginId,
                                           String residentName,
                                           String flatNumber,
                                           String societyId,
                                           String reason,
                                           String ipAddress,
                                           String userAgent) {
        String effectiveSocId = (societyId != null && !societyId.isBlank()) ? societyId : "SOC-101";

        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", UUID.randomUUID().toString());
        payload.put("flatNumber", flatNumber);
        payload.put("residentUserId", residentUserId);
        payload.put("residentName", residentName != null ? residentName : residentLoginId);
        payload.put("reason", reason != null ? reason : "Emergency Assistance Requested");
        payload.put("triggeredAt", Instant.now().toString());

        // 1. Dispatch CRITICAL SOS Alert
        NotificationDocument notif = notificationService.dispatch(new NotificationEvent(
                effectiveSocId,
                residentUserId,
                residentLoginId,
                flatNumber,
                NotificationDocument.NotificationType.SOS_ALERT,
                NotificationDocument.NotificationPriority.CRITICAL,
                "🚨 SOS PANIC ALERT — FLAT " + flatNumber,
                "EMERGENCY: Resident " + residentName + " in Flat " + flatNumber + " triggered a panic alert! Immediate gate response required.",
                payload,
                "sos_" + flatNumber + "_" + (Instant.now().toEpochMilli() / 15000), // dedupe within 15s
                Instant.now().plus(300, ChronoUnit.SECONDS)
        ));

        // 2. Audit Trail Entry
        AuditLogDocument audit = new AuditLogDocument();
        audit.setSocietyId(effectiveSocId);
        audit.setUserId(residentUserId);
        audit.setLoginId(residentLoginId);
        audit.setRole("RESIDENT");
        audit.setAction("SOS_TRIGGERED");
        audit.setDetails("SOS Alert triggered for Flat " + flatNumber + ". Reason: " + reason);
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);
        audit.setTimestamp(Instant.now());
        auditLogRepository.save(audit);

        // 3. Real-time siren broadcast to all guards & admin
        messagingTemplate.convertAndSend("/topic/society/" + effectiveSocId + "/guards", notif);
        log.warn("[SosAlertService] CRITICAL SOS TRIGGERED by Flat {} in Society {}", flatNumber, effectiveSocId);

        return notif;
    }

    public Map<String, Object> acknowledgeSos(String notificationId,
                                              String guardLoginId,
                                              String societyId,
                                              String ipAddress) {
        NotificationDocument notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new java.util.NoSuchElementException("SOS alert not found: " + notificationId));

        notif.setStatus(NotificationDocument.NotificationStatus.ACTED);
        notif.setActedAt(Instant.now());
        if (notif.getPayload() != null) {
            notif.getPayload().put("acknowledgedByGuard", guardLoginId);
            notif.getPayload().put("acknowledgedAt", Instant.now().toString());
        }
        notificationRepository.save(notif);

        // Audit Trail Entry
        AuditLogDocument audit = new AuditLogDocument();
        audit.setSocietyId(societyId);
        audit.setLoginId(guardLoginId);
        audit.setRole("GUARD");
        audit.setAction("SOS_ACKNOWLEDGED");
        audit.setDetails("Guard " + guardLoginId + " acknowledged SOS alert for Flat " + notif.getFlatNumber());
        audit.setIpAddress(ipAddress);
        audit.setTimestamp(Instant.now());
        auditLogRepository.save(audit);

        // Notify guards and resident that SOS has been acknowledged
        messagingTemplate.convertAndSend("/topic/society/" + societyId + "/guards", Map.of(
                "action", "SOS_ACKNOWLEDGED",
                "notificationId", notificationId,
                "flatNumber", notif.getFlatNumber(),
                "guard", guardLoginId
        ));

        return Map.of("success", true, "acknowledgedBy", guardLoginId);
    }
}
