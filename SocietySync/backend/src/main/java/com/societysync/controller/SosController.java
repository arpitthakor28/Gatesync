package com.societysync.controller;

import com.societysync.mongo.document.NotificationDocument;
import com.societysync.security.UserPrincipal;
import com.societysync.service.SosAlertService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    private final SosAlertService sosAlertService;

    public SosController(SosAlertService sosAlertService) {
        this.sosAlertService = sosAlertService;
    }

    // Resident triggers emergency SOS panic alert
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @PostMapping("/trigger")
    public NotificationDocument triggerSos(
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            HttpServletRequest request) {

        String reason = body != null ? body.getOrDefault("reason", "Emergency assistance requested at Flat " + principal.getFlatNumber()) : "Emergency Assistance";
        String ip = extractClientIp(request);

        return sosAlertService.triggerSos(
                principal.getUserId(),
                principal.getUsername(),
                principal.getFullName(),
                principal.getFlatNumber(),
                principal.getSocietyId(),
                reason,
                ip,
                userAgent
        );
    }

    // Guard on duty acknowledges the SOS panic alert
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @PostMapping("/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeSos(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String notificationId = body.get("notificationId");
        if (notificationId == null || notificationId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "notificationId is required"));
        }

        String ip = extractClientIp(request);
        Map<String, Object> result = sosAlertService.acknowledgeSos(
                notificationId,
                principal.getUsername(),
                principal.getSocietyId(),
                ip
        );
        return ResponseEntity.ok(result);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
