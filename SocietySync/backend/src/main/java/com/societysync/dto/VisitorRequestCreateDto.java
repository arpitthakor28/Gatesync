package com.societysync.dto;

import jakarta.validation.constraints.NotBlank;

public record VisitorRequestCreateDto(
    @NotBlank String visitorName,
    String visitorPhone,
    String purpose,
    String photoUrl,
    @NotBlank String flatNumber
) {}
