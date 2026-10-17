package com.societysync.dto;

import jakarta.validation.constraints.NotBlank;

public record AnnouncementCreateDto(
    @NotBlank String title,
    @NotBlank String content
) {}
