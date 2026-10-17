package com.societysync.controller;

import com.societysync.dto.AuthResponse;
import com.societysync.dto.LoginRequest;
import com.societysync.dto.RefreshRequest;
import com.societysync.dto.ResetPasswordDto;
import com.societysync.dto.SessionDto;
import com.societysync.security.UserPrincipal;
import com.societysync.service.AuthService;
import com.societysync.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            HttpServletRequest httpRequest) {

        String ipAddress = extractClientIp(httpRequest);
        AuthResponse res = authService.login(request, userAgent, ipAddress);

        ResponseCookie cookie = buildRefreshTokenCookie(res.refreshToken(), Duration.ofDays(30).toSeconds());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(res);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody(required = false) RefreshRequest bodyRequest,
            HttpServletRequest httpRequest) {

        String token = extractRefreshToken(httpRequest, bodyRequest);
        String ipAddress = extractClientIp(httpRequest);

        AuthResponse res = authService.refresh(token, ipAddress);

        ResponseCookie cookie = buildRefreshTokenCookie(res.refreshToken(), Duration.ofDays(30).toSeconds());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) RefreshRequest bodyRequest,
            HttpServletRequest httpRequest) {

        String token = extractRefreshToken(httpRequest, bodyRequest);
        if (token != null) {
            authService.logout(token);
        }

        ResponseCookie clearCookie = buildRefreshTokenCookie("", 0);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/sessions")
    public List<SessionDto> getActiveSessions(
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        String currentToken = extractRefreshToken(httpRequest, null);
        return authService.getSessions(principal.getUserId(), currentToken);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> revokeSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean revoked = authService.revokeSession(sessionId, principal.getUserId());
        return ResponseEntity.ok(Map.of("revoked", revoked));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        userService.resetPassword(principal.getUsername(), dto.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    private ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, token != null ? token : "")
                .httpOnly(true)
                .secure(true) // Mandatory for SameSite=None
                .sameSite("None") // Needed for GitHub Pages -> Render cross-site API calls
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    private String extractRefreshToken(HttpServletRequest request, RefreshRequest bodyRequest) {
        // 1. Check HTTP-only Cookie
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    return c.getValue();
                }
            }
        }
        // 2. Check X-Refresh-Token header
        String headerToken = request.getHeader("X-Refresh-Token");
        if (headerToken != null && !headerToken.isBlank()) {
            return headerToken;
        }
        // 3. Fallback to request body for environments where third-party cookies are blocked
        if (bodyRequest != null && bodyRequest.refreshToken() != null && !bodyRequest.refreshToken().isBlank()) {
            return bodyRequest.refreshToken();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
