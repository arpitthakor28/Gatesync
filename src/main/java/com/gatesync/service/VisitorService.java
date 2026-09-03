package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.VisitorDtos.*;
import com.gatesync.model.*;
import com.gatesync.notification.NotificationService;
import com.gatesync.repository.mongo.AuditLogMongoRepository;
import com.gatesync.repository.mongo.PreApprovedPassMongoRepository;
import com.gatesync.repository.mongo.UserMongoRepository;
import com.gatesync.repository.mongo.VisitorRequestMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorService {

    private final VisitorRequestMongoRepository visitorRequestRepository;
    private final PreApprovedPassMongoRepository preApprovedPassRepository;
    private final AuditLogMongoRepository auditLogRepository;
    private final UserMongoRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final MongoSequenceService sequenceService;

    public VisitorRequest registerVisitor(VisitorRegistrationRequest req) {
        VisitorRequest request = VisitorRequest.builder()
                .id(sequenceService.nextId("visitor_requests"))
                .visitorName(req.getVisitorName())
                .visitorPhone(req.getVisitorPhone())
                .purpose(req.getPurpose())
                .vehicleNumber(req.getVehicleNumber())
                .photoUrl(req.getPhotoUrl())
                .targetBlock(req.getTargetBlock())
                .targetFlat(req.getTargetFlat())
                .gateName(req.getGateName() != null ? req.getGateName() : "Main Gate A")
                .guardName(req.getGuardName() != null ? req.getGuardName() : "On-Duty Guard")
                .status(VisitorStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        // Synchronous save, exception propagates - a failed write here should NOT
        // report success back to the guard.
        VisitorRequest saved = visitorRequestRepository.save(request);
        log.info("Saved visitor entry to MongoDB: {}", saved.getVisitorName());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(saved.getGuardName())
                    .actorRole("GUARD")
                    .actionCategory("VISITOR_ENTRY")
                    .description("Registered new visitor '" + saved.getVisitorName() + "' for Flat " + saved.getTargetBlock() + "-" + saved.getTargetFlat())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on visitor registration: {}", e.getMessage());
        }

        // Find Target Resident
        Optional<User> targetUser = userRepository.findByBlockNumberAndFlatNumber(
                saved.getTargetBlock() != null ? saved.getTargetBlock() : "A",
                saved.getTargetFlat() != null ? saved.getTargetFlat() : "101"
        );

        if (targetUser.isEmpty()) {
            log.warn("No resident found for {}-{}; visitor alert will only reach the guard queue.",
                    saved.getTargetBlock(), saved.getTargetFlat());
        }

        // Dispatch Multi-channel Notification (WebSocket + SMS fallback + Audit Logging)
        notificationService.notifyResidentOfVisitor(saved, targetUser.orElse(null));

        return saved;
    }

    public VisitorRequest respondToRequest(ApprovalDecisionRequest req, String responderName) {
        VisitorRequest request = visitorRequestRepository.findById(req.getRequestId())
                .orElseThrow(() -> new RuntimeException("Visitor request not found"));

        request.setStatus(req.getStatus());
        request.setRespondedAt(LocalDateTime.now());
        if (req.getStatus() == VisitorStatus.DENIED) {
            request.setDenialReason(req.getDenialReason());
        } else if (req.getStatus() == VisitorStatus.APPROVED) {
            request.setCheckInTime(LocalDateTime.now());
        }

        VisitorRequest updated = visitorRequestRepository.save(request);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(responderName)
                    .actorRole("RESIDENT")
                    .actionCategory("APPROVAL")
                    .description(req.getStatus().name() + " entry request for visitor '" + updated.getVisitorName() + "'")
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on visitor response: {}", e.getMessage());
        }

        // Broadcast Realtime Update
        NotificationEvent event = NotificationEvent.builder()
                .type("VISITOR_UPDATE")
                .requestId(updated.getId())
                .visitorName(updated.getVisitorName())
                .purpose(updated.getPurpose())
                .photoUrl(updated.getPhotoUrl())
                .targetBlock(updated.getTargetBlock())
                .targetFlat(updated.getTargetFlat())
                .status(updated.getStatus())
                .timestamp(updated.getRespondedAt())
                .build();

        messagingTemplate.convertAndSend("/topic/guard/queue", event);
        messagingTemplate.convertAndSend("/topic/resident/" + updated.getTargetBlock() + "-" + updated.getTargetFlat(), event);

        return updated;
    }

    public PreApprovedPass createPreApprovedPass(PreApprovePassRequest req) {
        String passCode = "GS-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        PreApprovedPass pass = PreApprovedPass.builder()
                .passCode(passCode)
                .guestName(req.getGuestName())
                .guestPhone(req.getGuestPhone())
                .category(req.getCategory())
                .residentFlat(req.getResidentFlat())
                .residentName(req.getResidentName())
                .validUntil(LocalDateTime.now().plusHours(req.getValidHours() > 0 ? req.getValidHours() : 24))
                .used(false)
                .build();

        PreApprovedPass saved = preApprovedPassRepository.save(pass);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(req.getResidentName())
                    .actorRole("RESIDENT")
                    .actionCategory("PRE_APPROVE")
                    .description("Generated pre-approved pass " + passCode + " for guest '" + req.getGuestName() + "'")
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on pre-approved pass creation: {}", e.getMessage());
        }

        return saved;
    }

    public List<VisitorRequest> getRequestsForFlat(String block, String flat) {
        return visitorRequestRepository.findByTargetBlockAndTargetFlatOrderByCreatedAtDesc(block, flat);
    }

    public List<VisitorRequest> getAllRequests() {
        return visitorRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<VisitorRequest> getPendingRequests() {
        return visitorRequestRepository.findByStatusOrderByCreatedAtDesc(VisitorStatus.PENDING);
    }

    public List<PreApprovedPass> getPassesForFlat(String flat) {
        return preApprovedPassRepository.findByResidentFlatOrderByCreatedAtDesc(flat);
    }
}
