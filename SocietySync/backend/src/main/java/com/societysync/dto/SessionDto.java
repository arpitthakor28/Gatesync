package com.societysync.dto;

import java.time.Instant;

public record SessionDto(
        Long id,
        String deviceInfo,
        String ipAddress,
        Instant createdAt,
        Instant lastUsedAt,
        boolean current
) {}
