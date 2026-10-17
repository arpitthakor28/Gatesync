package com.societysync.service;

import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import com.societysync.repository.VisitorRequestRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

import com.societysync.dto.NotificationEvent;
import com.societysync.entity.User;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class VisitorService {

    private final VisitorRequestRepository repository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final EscalationService escalationService;
    private final UserRepository userRepository;

    public VisitorService(VisitorRequestRepository repository,
                          SimpMessagingTemplate messagingTemplate,
                          NotificationService notificationService,
                          EscalationService escalationService,
                          UserRepository userRepository) {
        this.repository = repository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.escalationService = escalationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public VisitorRequest createRequest(VisitorRequestCreateDto dto, String guardLoginId, String societyId) {
        VisitorRequest request = new VisitorRequest();
        String effectiveSocId = (societyId != null && !societyId.isBlank()) ? societyId : "SOC-101";
        request.setSocietyId(effectiveSocId);
        request.setVisitorName(dto.visitorName());
        request.setVisitorPhone(dto.visitorPhone());
        request.setVehicleNumber(dto.vehicleNumber());
        request.setPurpose(dto.purpose());
        request.setPhotoUrl(dto.photoUrl());
        request.setFlatNumber(dto.flatNumber());
        request.setCreatedByGuardLoginId(guardLoginId);
        request.setStatus(VisitorStatus.PENDING);
        request.setCreatedAt(Instant.now());
        VisitorRequest saved = repository.save(request);

        // Find resident for flat to target notification directly
        Optional<User> residentOpt = userRepository.findBySocietyIdAndFlatNumber(effectiveSocId, dto.flatNumber());
        Long residentUserId = residentOpt.map(User::getId).orElse(0L);
        String residentLoginId = residentOpt.map(User::getLoginId).orElse(null);

        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", saved.getId());
        payload.put("flatNumber", saved.getFlatNumber());
        payload.put("visitorName", saved.getVisitorName());
        payload.put("visitorPhone", saved.getVisitorPhone());
        payload.put("vehicleNumber", saved.getVehicleNumber());
        payload.put("purpose", saved.getPurpose());
        payload.put("visitorPhotoUrl", saved.getPhotoUrl());
        payload.put("guardLoginId", guardLoginId);

        // Single entry point: dispatch VISITOR_REQUEST (STOMP + FCM Web Push)
        notificationService.dispatch(new NotificationEvent(
                saved.getSocietyId(),
                residentUserId,
                residentLoginId,
                saved.getFlatNumber(),
                NotificationDocument.NotificationType.VISITOR_REQUEST,
                NotificationDocument.NotificationPriority.CRITICAL,
                "🚨 Incoming Visitor at Gate: " + saved.getVisitorName(),
                saved.getVisitorName() + " (" + (saved.getPurpose() != null ? saved.getPurpose() : "Visitor") + ") requested entry to Flat " + saved.getFlatNumber(),
                payload,
                "visitor_req_" + saved.getId(),
                Instant.now().plus(120, ChronoUnit.SECONDS)
        ));

        // Schedule persistent MongoDB escalation timers (60s reminder, 120s guard alert, 10m expire)
        escalationService.scheduleForRequest(saved);

        // Live broadcast to guard screen
        messagingTemplate.convertAndSend("/topic/society/" + saved.getSocietyId() + "/guards", saved);
        return saved;
    }

    @Transactional
    public VisitorRequest decide(Long requestId, boolean approved, String denialReason,
                                 String residentLoginId, String societyId, String residentFlat) {
        VisitorRequest request = repository.findByIdAndSocietyId(requestId, societyId)
                .orElseThrow(() -> new NoSuchElementException("Visitor request not found"));

        // Strictly verify flat ownership: resident can ONLY decide on visitors for their own flat
        if (residentFlat != null && !residentFlat.equalsIgnoreCase(request.getFlatNumber())) {
            throw new AccessDeniedException("You cannot approve visitors for another flat");
        }

        // Atomic check: prevent double decisions (maps to 409 Conflict)
        if (request.getStatus() != VisitorStatus.PENDING) {
            throw new IllegalStateException("This request has already been resolved with status: " + request.getStatus());
        }

        request.setStatus(approved ? VisitorStatus.APPROVED : VisitorStatus.REJECTED);
        request.setRespondedAt(Instant.now());
        request.setRespondedByLoginId(residentLoginId);
        request.setDenialReason(denialReason);
        VisitorRequest saved = repository.save(request);

        // Cancel pending escalation timers
        escalationService.cancelForRequest(requestId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", saved.getId());
        payload.put("flatNumber", saved.getFlatNumber());
        payload.put("visitorName", saved.getVisitorName());
        payload.put("status", saved.getStatus().name());
        payload.put("denialReason", denialReason);
        payload.put("respondedBy", residentLoginId);

        // Dispatch decision notification
        notificationService.dispatch(new NotificationEvent(
                saved.getSocietyId(),
                0L,
                null,
                saved.getFlatNumber(),
                approved ? NotificationDocument.NotificationType.VISITOR_APPROVED : NotificationDocument.NotificationType.VISITOR_REJECTED,
                NotificationDocument.NotificationPriority.HIGH,
                approved ? "Gate Entry Approved" : "Gate Entry Denied",
                "Flat " + saved.getFlatNumber() + " " + (approved ? "APPROVED" : "DENIED") + " entry for " + saved.getVisitorName(),
                payload,
                "visitor_decide_" + saved.getId(),
                Instant.now().plus(60, ChronoUnit.SECONDS)
        ));

        // Notify guards and resident channel live
        messagingTemplate.convertAndSend("/topic/society/" + saved.getSocietyId() + "/guards", saved);
        messagingTemplate.convertAndSend("/topic/society/" + saved.getSocietyId() + "/flat/" + saved.getFlatNumber(), saved);
        return saved;
    }

    @Transactional
    public VisitorRequest checkout(Long requestId, String societyId, String guardLoginId) {
        VisitorRequest request = repository.findByIdAndSocietyId(requestId, societyId)
                .orElseThrow(() -> new NoSuchElementException("Visitor request not found"));

        request.setCheckedOutAt(Instant.now());
        VisitorRequest saved = repository.save(request);

        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", saved.getId());
        payload.put("flatNumber", saved.getFlatNumber());
        payload.put("visitorName", saved.getVisitorName());
        payload.put("checkedOutAt", saved.getCheckedOutAt().toString());

        notificationService.dispatch(new NotificationEvent(
                saved.getSocietyId(),
                0L,
                null,
                saved.getFlatNumber(),
                NotificationDocument.NotificationType.VISITOR_EXIT,
                NotificationDocument.NotificationPriority.NORMAL,
                "Visitor Checked Out",
                saved.getVisitorName() + " has departed the society premises.",
                payload,
                "visitor_exit_" + saved.getId(),
                Instant.now().plus(60, ChronoUnit.SECONDS)
        ));

        messagingTemplate.convertAndSend("/topic/society/" + saved.getSocietyId() + "/guards", saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<VisitorRequest> pendingForGuard(String societyId) {
        return repository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, VisitorStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<VisitorRequest> historyForSociety(String societyId) {
        return repository.findBySocietyIdOrderByCreatedAtDesc(societyId);
    }

    @Transactional(readOnly = true)
    public List<VisitorRequest> pendingForFlat(String societyId, String flatNumber) {
        return repository.findBySocietyIdAndFlatNumberAndStatusOrderByCreatedAtDesc(societyId, flatNumber, VisitorStatus.PENDING);
    }

    @Transactional
    public int expireStaleRequests(int minutesOld) {
        Instant cutoff = Instant.now().minus(minutesOld, ChronoUnit.MINUTES);
        List<VisitorRequest> stale = repository.findByStatusAndCreatedAtBefore(VisitorStatus.PENDING, cutoff);
        stale.forEach(r -> {
            r.setStatus(VisitorStatus.EXPIRED);
            messagingTemplate.convertAndSend("/topic/society/" + r.getSocietyId() + "/guards", r);
        });
        repository.saveAll(stale);
        return stale.size();
    }
}
