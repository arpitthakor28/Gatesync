package com.gatesync.controller;

import com.gatesync.dto.AdminDtos.*;
import com.gatesync.model.AuditLog;
import com.gatesync.model.Flat;
import com.gatesync.model.Role;
import com.gatesync.model.User;
import com.gatesync.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(adminService.createUser(req));
    }

    @GetMapping("/residents")
    public ResponseEntity<List<User>> getResidents() {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.RESIDENT));
    }

    @GetMapping("/guards")
    public ResponseEntity<List<User>> getGuards() {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.GUARD));
    }

    @GetMapping("/flats")
    public ResponseEntity<List<Flat>> getFlats() {
        return ResponseEntity.ok(adminService.getAllFlats());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
