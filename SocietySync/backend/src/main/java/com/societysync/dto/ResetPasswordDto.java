package com.societysync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordDto(
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
) {}
