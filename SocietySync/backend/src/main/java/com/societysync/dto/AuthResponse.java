package com.societysync.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    Long userId,
    String loginId,
    String role,
    String societyId,
    String flatNumber,
    String fullName,
    boolean mustResetPassword
) {}
