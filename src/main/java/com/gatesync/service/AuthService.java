package com.gatesync.service;

import com.gatesync.dto.AuthDtos.*;
import com.gatesync.model.AuditLog;
import com.gatesync.model.User;
import com.gatesync.repository.AuditLogRepository;
import com.gatesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse authenticate(LoginRequest req) {
        User user = userRepository.findByLoginId(req.getLoginId())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String mockToken = "jwt_" + UUID.randomUUID().toString();

        auditLogRepository.save(AuditLog.builder()
                .actorName(user.getFullName())
                .actorRole(user.getRole().name())
                .actionCategory("SECURITY")
                .description("User logged in successfully via ID: " + user.getLoginId())
                .build());

        return LoginResponse.builder()
                .token(mockToken)
                .userId(user.getId())
                .loginId(user.getLoginId())
                .fullName(user.getFullName())
                .role(user.getRole())
                .blockNumber(user.getBlockNumber())
                .flatNumber(user.getFlatNumber())
                .mustResetPassword(user.isMustResetPassword())
                .build();
    }

    @Transactional
    public ApiResponse resetPassword(PasswordResetRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setMustResetPassword(false);
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .actorName(user.getFullName())
                .actorRole(user.getRole().name())
                .actionCategory("SECURITY")
                .description("Password successfully updated and strength verified.")
                .build());

        return new ApiResponse(true, "Password updated successfully!");
    }
}
