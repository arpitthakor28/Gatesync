package com.gatesync.dto;

import com.gatesync.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String loginId;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private Long userId;
        private String loginId;
        private String fullName;
        private Role role;
        private String blockNumber;
        private String flatNumber;
        private boolean mustResetPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordResetRequest {
        private Long userId;
        private String currentPassword;
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiResponse {
        private boolean success;
        private String message;
    }
}
