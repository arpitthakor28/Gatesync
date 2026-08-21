package com.gatesync.controller;

import com.gatesync.dto.AdminDtos.*;
import com.gatesync.model.AuditLog;
import com.gatesync.model.Flat;
import com.gatesync.model.Role;
import com.gatesync.model.User;
import com.gatesync.security.CustomUserPrincipal;
import com.gatesync.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final com.gatesync.service.ClubhouseService clubhouseService;
    private final com.gatesync.service.CommunityProblemService communityProblemService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(adminService.createUser(req));
    }

    @GetMapping("/residents")
    public ResponseEntity<List<User>> getResidents(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.RESIDENT));
    }

    @GetMapping("/guards")
    public ResponseEntity<List<User>> getGuards(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.GUARD));
    }

    @GetMapping("/flats")
    public ResponseEntity<List<Flat>> getFlats(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(adminService.getAllFlats());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    @GetMapping("/clubhouse/bookings")
    public ResponseEntity<List<com.gatesync.model.ClubhouseBooking>> getAllClubhouseBookings(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(clubhouseService.getAllBookings("SOC-101"));
    }

    @PostMapping("/clubhouse/bookings/{id}/status")
    public ResponseEntity<com.gatesync.model.ClubhouseBooking> updateClubhouseStatus(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(clubhouseService.updateBookingStatus(id, status, reason));
    }

    @GetMapping("/problems")
    public ResponseEntity<List<com.gatesync.model.CommunityProblem>> getAllProblems(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(communityProblemService.getAllProblems("SOC-101"));
    }

    @PostMapping("/problems/{id}/resolve")
    public ResponseEntity<com.gatesync.model.CommunityProblem> resolveProblem(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String reply) {
        return ResponseEntity.ok(communityProblemService.resolveProblem(id, reply));
    }

    @DeleteMapping("/problems/{id}")
    public ResponseEntity<Void> deleteProblem(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long id) {
        communityProblemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clear-all-data")
    public ResponseEntity<com.gatesync.dto.AuthDtos.ApiResponse> clearAllData() {
        adminService.clearAllData();
        return ResponseEntity.ok(new com.gatesync.dto.AuthDtos.ApiResponse(true, "All database records and MongoDB Atlas collections cleared successfully."));
    }
}
