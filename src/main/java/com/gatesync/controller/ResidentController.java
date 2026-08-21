package com.gatesync.controller;

import com.gatesync.dto.AuthDtos.*;
import com.gatesync.dto.VisitorDtos.*;
import com.gatesync.model.PreApprovedPass;
import com.gatesync.model.VisitorRequest;
import com.gatesync.security.CustomUserPrincipal;
import com.gatesync.service.AuthService;
import com.gatesync.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resident")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('RESIDENT')")
public class ResidentController {

    private final VisitorService visitorService;
    private final AuthService authService;
    private final com.gatesync.service.ClubhouseService clubhouseService;
    private final com.gatesync.service.CommunityProblemService communityProblemService;

    @GetMapping("/visitors")
    public ResponseEntity<List<VisitorRequest>> getFlatVisitors(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(required = false) String block,
            @RequestParam(required = false) String flat) {

        String effectiveBlock = (block != null && !block.isEmpty()) ? block : (principal != null ? principal.getBlockNumber() : "A");
        String effectiveFlat = (flat != null && !flat.isEmpty()) ? flat : (principal != null ? principal.getFlatNumber() : "101");

        return ResponseEntity.ok(visitorService.getRequestsForFlat(effectiveBlock, effectiveFlat));
    }

    @PostMapping("/visitor/respond")
    public ResponseEntity<VisitorRequest> respondToRequest(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody ApprovalDecisionRequest req) {

        String responderName = (principal != null && principal.getUsername() != null) ? principal.getUsername() : "Resident";
        return ResponseEntity.ok(visitorService.respondToRequest(req, responderName));
    }

    @PostMapping("/pass/create")
    public ResponseEntity<PreApprovedPass> createPreApprovedPass(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody PreApprovePassRequest req) {

        if (principal != null) {
            if (req.getResidentName() == null || req.getResidentName().isEmpty()) {
                req.setResidentName(principal.getUsername());
            }
            if (req.getResidentFlat() == null || req.getResidentFlat().isEmpty()) {
                req.setResidentFlat(principal.getBlockNumber() + "-" + principal.getFlatNumber());
            }
        }
        return ResponseEntity.ok(visitorService.createPreApprovedPass(req));
    }

    @GetMapping("/passes")
    public ResponseEntity<List<PreApprovedPass>> getPasses(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(required = false) String flat) {

        String effectiveFlat = (flat != null && !flat.isEmpty()) ? flat : (principal != null ? (principal.getBlockNumber() + "-" + principal.getFlatNumber()) : "A-101");
        return ResponseEntity.ok(visitorService.getPassesForFlat(effectiveFlat));
    }

    @PostMapping("/clubhouse/book")
    public ResponseEntity<com.gatesync.model.ClubhouseBooking> createClubhouseBooking(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody com.gatesync.model.ClubhouseBooking booking) {

        if (principal != null && (booking.getResidentName() == null || booking.getResidentName().isEmpty())) {
            booking.setResidentName(principal.getUsername());
            booking.setFlat(principal.getBlockNumber() + "-" + principal.getFlatNumber());
        }
        return ResponseEntity.ok(clubhouseService.createBooking(booking));
    }

    @GetMapping("/clubhouse/my-bookings")
    public ResponseEntity<List<com.gatesync.model.ClubhouseBooking>> getMyClubhouseBookings(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        String residentName = (principal != null && principal.getUsername() != null) ? principal.getUsername() : "Resident";
        return ResponseEntity.ok(clubhouseService.getBookingsForResident(residentName));
    }

    @PostMapping("/problems/report")
    public ResponseEntity<com.gatesync.model.CommunityProblem> reportCommunityProblem(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody com.gatesync.model.CommunityProblem problem) {

        if (principal != null) {
            if (problem.getReporterName() == null || problem.getReporterName().isEmpty()) {
                problem.setReporterName(principal.getUsername());
            }
            if (problem.getFlat() == null || problem.getFlat().isEmpty()) {
                problem.setFlat(principal.getBlockNumber() + "-" + principal.getFlatNumber());
            }
        }
        return ResponseEntity.ok(communityProblemService.reportProblem(problem));
    }

    @GetMapping("/problems/all")
    public ResponseEntity<List<com.gatesync.model.CommunityProblem>> getAllCommunityProblems(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        return ResponseEntity.ok(communityProblemService.getAllProblems("SOC-101"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody PasswordResetRequest req) {

        if (principal != null) {
            req.setUserId(principal.getUserId());
        }
        return ResponseEntity.ok(authService.resetPassword(req));
    }
}
