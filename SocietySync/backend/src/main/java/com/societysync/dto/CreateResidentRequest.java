package com.societysync.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateResidentRequest(
    @NotBlank String flatNumber,
    @NotBlank String fullName,
    @NotBlank String mobile
) {}
