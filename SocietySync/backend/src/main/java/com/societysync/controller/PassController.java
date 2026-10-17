package com.societysync.controller;

import com.societysync.mongo.document.PreApprovedPassDocument;
import com.societysync.security.UserPrincipal;
import com.societysync.service.PreApprovedPassService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PassController {

    private final PreApprovedPassService passService;

    public PassController(PreApprovedPassService passService) {
        this.passService = passService;
    }

    // Resident generates a pre-approved pass
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @PostMapping("/resident/passes")
    public PreApprovedPassDocument createPass(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        String visitorName = (String) body.getOrDefault("visitorName", "Guest");
        String visitorPhone = (String) body.get("visitorPhone");
        String vehicleNumber = (String) body.get("vehicleNumber");
        String category = (String) body.getOrDefault("category", "GUEST");
        boolean leaveAtGate = Boolean.TRUE.equals(body.get("leaveAtGate"));
        int validityHours = body.get("validityHours") instanceof Number ? ((Number) body.get("validityHours")).intValue() : 4;

        return passService.createPass(
                principal.getSocietyId(),
                principal.getUserId(),
                principal.getUsername(),
                principal.getFlatNumber(),
                visitorName,
                visitorPhone,
                vehicleNumber,
                category,
                leaveAtGate,
                validityHours
        );
    }

    // Resident lists their passes
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @GetMapping("/resident/passes")
    public List<PreApprovedPassDocument> getMyPasses(@AuthenticationPrincipal UserPrincipal principal) {
        return passService.getPassesForFlat(principal.getSocietyId(), principal.getFlatNumber());
    }

    // Guard scans QR or enters 6-digit OTP code to verify and redeem
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @PostMapping("/guard/passes/verify")
    public ResponseEntity<Map<String, Object>> verifyPass(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        String code = body.get("passCode");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "passCode is required"));
        }

        Map<String, Object> result = passService.verifyAndRedeemPass(code.trim(), principal.getSocietyId(), principal.getUsername());
        return ResponseEntity.ok(result);
    }
}
