package com.gatesync.notification;

import com.gatesync.dto.NotificationDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resident/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationLogRepository notificationLogRepository;

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesResponse> getPreferences() {
        NotificationPreferencesResponse prefs = NotificationPreferencesResponse.builder()
                .visitorPopupEnabled(true)
                .soundAlertEnabled(true)
                .browserNotificationEnabled(true)
                .smsEnabled(true)
                .whatsappEnabled(false)
                .primaryPhone("9876543210")
                .backupPhone("9876500000")
                .smsImmediately(true)
                .fallbackAfterSeconds(60)
                .build();
        return ResponseEntity.ok(prefs);
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
            @RequestBody NotificationPreferencesRequest req
    ) {
        NotificationPreferencesResponse updated = NotificationPreferencesResponse.builder()
                .visitorPopupEnabled(req.isVisitorPopupEnabled())
                .soundAlertEnabled(req.isSoundAlertEnabled())
                .browserNotificationEnabled(req.isBrowserNotificationEnabled())
                .smsEnabled(req.isSmsEnabled())
                .whatsappEnabled(req.isWhatsappEnabled())
                .primaryPhone(req.getPrimaryPhone())
                .backupPhone(req.getBackupPhone())
                .smsImmediately(req.isSmsImmediately())
                .fallbackAfterSeconds(req.getFallbackAfterSeconds())
                .build();
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<NotificationLog>> getLogs(
            @RequestParam(required = false) Long visitorRequestId
    ) {
        if (visitorRequestId != null) {
            return ResponseEntity.ok(notificationLogRepository.findByVisitorRequestId(visitorRequestId));
        }
        return ResponseEntity.ok(notificationLogRepository.findAll());
    }
}
