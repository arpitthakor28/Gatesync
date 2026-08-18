package com.gatesync.controller;

import com.gatesync.dto.AuthDtos.*;
import com.gatesync.security.CustomUserPrincipal;
import com.gatesync.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.authenticate(req));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<LoginResponse> registerAdmin(@RequestBody RegisterAdminRequest req) {
        return ResponseEntity.ok(authService.registerAdmin(req));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody PasswordResetRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req));
    }

    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse> setPassword(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody PasswordResetRequest req) {
        return ResponseEntity.ok(authService.setPassword(principal, req));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getMe(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(authService.getMe(principal));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout() {
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully"));
    }
}
