package com.societysync.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String role,
    String loginId,
    String fullName,
    boolean mustResetPassword
) {}
