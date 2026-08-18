package com.gatesync.controller;

import com.gatesync.dto.VisitorDtos.*;
import com.gatesync.model.VisitorRequest;
import com.gatesync.security.CustomUserPrincipal;
import com.gatesync.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('GUARD')")
public class GuardController {

    private final VisitorService visitorService;

    @PostMapping("/visitor/register")
    public ResponseEntity<VisitorRequest> registerVisitor(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody VisitorRegistrationRequest req) {
        return ResponseEntity.ok(visitorService.registerVisitor(req));
    }

    @GetMapping("/visitors/active")
    public ResponseEntity<List<VisitorRequest>> getActiveQueue(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(visitorService.getPendingRequests());
    }

    @GetMapping("/visitors/all")
    public ResponseEntity<List<VisitorRequest>> getAllVisitorLogs(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(visitorService.getAllRequests());
    }
}
