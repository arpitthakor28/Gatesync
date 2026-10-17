package com.societysync.controller;

import com.societysync.dto.AuthResponse;
import com.societysync.dto.LoginRequest;
import com.societysync.dto.RefreshRequest;
import com.societysync.dto.ResetPasswordDto;
import com.societysync.service.AuthService;
import com.societysync.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    // Principal comes from the validated JWT (see JwtAuthFilter) - never from the request
    // body - so a user can only ever reset their own password, not someone else's.
    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordDto dto, Authentication auth) {
        userService.resetPassword(auth.getName(), dto.newPassword());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                               @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        return authService.login(request, userAgent);
    }

    // Called silently by the frontend's axios interceptor whenever the access token expires -
    // this, plus the refresh token stored on the device, is what "login once" actually means.
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public void logout(Authentication auth) {
        if (auth != null) {
            authService.logoutByLoginId(auth.getName());
        }
    }
}
