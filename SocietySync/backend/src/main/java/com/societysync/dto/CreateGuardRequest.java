package com.societysync.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateGuardRequest(
    @NotBlank String loginId,
    @NotBlank String fullName,
    @NotBlank String mobile
) {}
