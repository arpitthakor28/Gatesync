package com.societysync.service;

import com.societysync.dto.NotificationEvent;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.document.PreApprovedPassDocument;
import com.societysync.mongo.repository.PreApprovedPassRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PreApprovedPassService {

    private static final Logger log = LoggerFactory.getLogger(PreApprovedPassService.class);

    private final PreApprovedPassRepository passRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public PreApprovedPassService(PreApprovedPassRepository passRepository,
                                  NotificationService notificationService,
                                  SimpMessagingTemplate messagingTemplate) {
        this.passRepository = passRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    public PreApprovedPassDocument createPass(String societyId,
                                              Long residentUserId,
                                              String residentLoginId,
                                              String flatNumber,
                                              String visitorName,
                                              String visitorPhone,
                                              String vehicleNumber,
                                              String category,
                                              boolean leaveAtGate,
                                              int validityHours) {
        PreApprovedPassDocument pass = new PreApprovedPassDocument();
        pass.setSocietyId(societyId != null ? societyId : "SOC-101");
        pass.setResidentUserId(residentUserId);
        pass.setResidentLoginId(residentLoginId);
        pass.setFlatNumber(flatNumber);
        pass.setVisitorName(visitorName);
        pass.setVisitorPhone(visitorPhone);
        pass.setVehicleNumber(vehicleNumber);
        pass.setCategory(category != null ? category.toUpperCase() : "GUEST");
        pass.setLeaveAtGate(leaveAtGate);

        // Generate 6-digit OTP code (e.g. 542891)
        int code = 100000 + secureRandom.nextInt(900000);
        pass.setPassCode(String.valueOf(code));

        Instant now = Instant.now();
        pass.setValidFrom(now);
        pass.setValidUntil(now.plus(validityHours > 0 ? validityHours : 4, ChronoUnit.HOURS));
        pass.setCreatedAt(now);

        PreApprovedPassDocument saved = passRepository.save(pass);
        log.info("[PreApprovedPassService] Created pass {} for flat {}", saved.getPassCode(), flatNumber);
        return saved;
    }

    public Map<String, Object> verifyAndRedeemPass(String passCode, String societyId, String guardLoginId) {
        PreApprovedPassDocument pass = passRepository.findByPassCodeAndSocietyId(passCode, societyId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or non-existent pass code: " + passCode));

        if (pass.isUsed()) {
            throw new IllegalStateException("Pass has already been redeemed on " + pass.getUsedAt());
        }

        if (pass.getValidUntil().isBefore(Instant.now())) {
            throw new IllegalStateException("Pass has expired on " + pass.getValidUntil());
        }

        pass.setUsed(true);
        pass.setUsedAt(Instant.now());
        pass.setUsedByGuardLoginId(guardLoginId);
        passRepository.save(pass);

        Map<String, Object> payload = new HashMap<>();
        payload.put("passId", pass.getId());
        payload.put("passCode", pass.getPassCode());
        payload.put("visitorName", pass.getVisitorName());
        payload.put("flatNumber", pass.getFlatNumber());
        payload.put("category", pass.getCategory());
        payload.put("leaveAtGate", pass.isLeaveAtGate());
        payload.put("guardLoginId", guardLoginId);

        // Notify resident PREAPPROVED_ARRIVED or DELIVERY_AT_GATE
        NotificationDocument.NotificationType type = pass.isLeaveAtGate()
                ? NotificationDocument.NotificationType.DELIVERY_AT_GATE
                : NotificationDocument.NotificationType.PREAPPROVED_ARRIVED;

        String title = pass.isLeaveAtGate() ? "📦 Package Left at Gate Desk" : "✅ Pre-Approved Visitor Arrived";
        String body = pass.isLeaveAtGate()
                ? pass.getVisitorName() + " (" + pass.getCategory() + ") left package at Gate Desk."
                : pass.getVisitorName() + " (" + pass.getCategory() + ") scanned valid pass and entered campus.";

        notificationService.dispatch(new NotificationEvent(
                pass.getSocietyId(),
                pass.getResidentUserId(),
                pass.getResidentLoginId(),
                pass.getFlatNumber(),
                type,
                NotificationDocument.NotificationPriority.NORMAL,
                title,
                body,
                payload,
                "pass_redeem_" + pass.getId(),
                Instant.now().plus(120, ChronoUnit.SECONDS)
        ));

        // Live notification to guard desk
        messagingTemplate.convertAndSend("/topic/society/" + pass.getSocietyId() + "/guards", Map.of(
                "action", "PASS_REDEEMED",
                "flatNumber", pass.getFlatNumber(),
                "visitorName", pass.getVisitorName(),
                "leaveAtGate", pass.isLeaveAtGate()
        ));

        return Map.of(
                "valid", true,
                "visitorName", pass.getVisitorName(),
                "flatNumber", pass.getFlatNumber(),
                "category", pass.getCategory(),
                "leaveAtGate", pass.isLeaveAtGate(),
                "passCode", pass.getPassCode()
        );
    }

    public List<PreApprovedPassDocument> getPassesForFlat(String societyId, String flatNumber) {
        return passRepository.findBySocietyIdAndFlatNumberOrderByCreatedAtDesc(societyId, flatNumber);
    }
}
