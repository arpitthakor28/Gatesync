package com.gatesync.controller;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.NotificationDtos.*;
import com.gatesync.model.EmergencyAlert;
import com.gatesync.notification.NotificationService;
import com.gatesync.repository.mongo.EmergencyAlertMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class EmergencyController {

    private final EmergencyAlertMongoRepository emergencyAlertRepository;
    private final NotificationService notificationService;
    private final MongoSequenceService sequenceService;

    @PostMapping("/sos")
    public ResponseEntity<EmergencyAlert> triggerEmergencySos(
            @RequestBody EmergencyAlertRequest req,
            @RequestHeader(value = "X-User-Name", defaultValue = "Resident / Guard") String callerName
    ) {
        log.warn("🚨 EMERGENCY SOS TRIGGERED by {}: {}", callerName, req.getEmergencyType());

        EmergencyAlert alert = EmergencyAlert.builder()
                .id(sequenceService.nextId("emergency_alerts"))
                .emergencyType(req.getEmergencyType() != null ? req.getEmergencyType() : "GENERAL")
                .callerName(req.getCallerName() != null ? req.getCallerName() : callerName)
                .callerRole(req.getCallerRole() != null ? req.getCallerRole() : "RESIDENT")
                .callerPhone(req.getCallerPhone())
                .blockNumber(req.getBlockNumber())
                .flatNumber(req.getFlatNumber())
                .gateName(req.getGateName() != null ? req.getGateName() : "Main Gate A")
                .note(req.getNote())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        EmergencyAlert saved = emergencyAlertRepository.save(alert);

        // Broadcast to WebSockets & save notification
        notificationService.broadcastEmergencyAlert(saved);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmergencyAlert>> getActiveEmergencies() {
        return ResponseEntity.ok(emergencyAlertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE"));
    }

    @GetMapping("/all")
    public ResponseEntity<List<EmergencyAlert>> getAllEmergencies() {
        return ResponseEntity.ok(emergencyAlertRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<EmergencyAlert> acknowledgeEmergency(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "On-Duty Guard") String ackUser
    ) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency alert not found"));

        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(ackUser);
        alert.setAcknowledgedAt(LocalDateTime.now());

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<EmergencyAlert> resolveEmergency(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Security Admin") String resolveUser
    ) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency alert not found"));

        alert.setStatus("RESOLVED");
        alert.setResolvedBy(resolveUser);
        alert.setResolvedAt(LocalDateTime.now());

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        return ResponseEntity.ok(saved);
    }
}
