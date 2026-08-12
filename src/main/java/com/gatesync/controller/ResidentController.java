package com.gatesync.controller;

import com.gatesync.dto.AuthDtos.*;
import com.gatesync.dto.VisitorDtos.*;
import com.gatesync.model.PreApprovedPass;
import com.gatesync.model.VisitorRequest;
import com.gatesync.service.AuthService;
import com.gatesync.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resident")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResidentController {

    private final VisitorService visitorService;
    private final AuthService authService;

    @GetMapping("/visitors")
    public ResponseEntity<List<VisitorRequest>> getFlatVisitors(
            @RequestParam String block,
            @RequestParam String flat) {
        return ResponseEntity.ok(visitorService.getRequestsForFlat(block, flat));
    }

    @PostMapping("/visitor/respond")
    public ResponseEntity<VisitorRequest> respondToRequest(
            @RequestBody ApprovalDecisionRequest req,
            @RequestParam(defaultValue = "Resident") String responderName) {
        return ResponseEntity.ok(visitorService.respondToRequest(req, responderName));
    }

    @PostMapping("/pass/create")
    public ResponseEntity<PreApprovedPass> createPreApprovedPass(@RequestBody PreApprovePassRequest req) {
        return ResponseEntity.ok(visitorService.createPreApprovedPass(req));
    }

    @GetMapping("/passes")
    public ResponseEntity<List<PreApprovedPass>> getPasses(@RequestParam String flat) {
        return ResponseEntity.ok(visitorService.getPassesForFlat(flat));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody PasswordResetRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req));
    }
}
