package com.societysync.service;

import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import com.societysync.repository.VisitorRequestRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * The core of the feature you asked for: a guard logs a visitor, the resident's device
 * gets a real-time popup over WebSocket, and their approve/reject decision is pushed
 * straight back to the guard's screen - no polling, no refresh needed on either side.
 */
@Service
public class VisitorService {

    private final VisitorRequestRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    public VisitorService(VisitorRequestRepository repository, SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.messagingTemplate = messagingTemplate;
    }

    public VisitorRequest createRequest(VisitorRequestCreateDto dto, String guardLoginId) {
        VisitorRequest request = new VisitorRequest();
        request.setVisitorName(dto.visitorName());
        request.setVisitorPhone(dto.visitorPhone());
        request.setPurpose(dto.purpose());
        request.setPhotoUrl(dto.photoUrl());
        request.setFlatNumber(dto.flatNumber());
        request.setCreatedByGuardLoginId(guardLoginId);
        VisitorRequest saved = repository.save(request);

        // Push the approve/reject popup straight to the resident's flat channel
        messagingTemplate.convertAndSend("/topic/visitor/" + dto.flatNumber(), saved);
        return saved;
    }

    public VisitorRequest decide(Long requestId, boolean approved, String residentLoginId) {
        VisitorRequest request = repository.findById(requestId)
                .orElseThrow(() -> new NoSuchElementException("Visitor request not found"));

        if (request.getStatus() != VisitorStatus.PENDING) {
            throw new IllegalStateException("This request has already been resolved");
        }

        request.setStatus(approved ? VisitorStatus.APPROVED : VisitorStatus.REJECTED);
        request.setRespondedAt(Instant.now());
        request.setRespondedByLoginId(residentLoginId);
        VisitorRequest saved = repository.save(request);

        // Notify the guard's screen (and gate display, if one subscribes) of the decision
        messagingTemplate.convertAndSend("/topic/guard/" + request.getCreatedByGuardLoginId(), saved);
        return saved;
    }

    public List<VisitorRequest> pendingForGuard(String guardLoginId) {
        return repository.findByCreatedByGuardLoginIdOrderByCreatedAtDesc(guardLoginId);
    }

    public List<VisitorRequest> pendingForFlat(String flatNumber) {
        return repository.findByFlatNumberAndStatusOrderByCreatedAtDesc(flatNumber, VisitorStatus.PENDING);
    }

    /** Runs periodically (see VisitorExpiryScheduler) so a resident's phone being off doesn't leave the gate stuck. */
    public int expireStaleRequests(int minutesOld) {
        Instant cutoff = Instant.now().minus(minutesOld, ChronoUnit.MINUTES);
        List<VisitorRequest> stale = repository.findByStatusAndCreatedAtBefore(VisitorStatus.PENDING, cutoff);
        stale.forEach(r -> {
            r.setStatus(VisitorStatus.EXPIRED);
            messagingTemplate.convertAndSend("/topic/guard/" + r.getCreatedByGuardLoginId(), r);
        });
        repository.saveAll(stale);
        return stale.size();
    }
}
