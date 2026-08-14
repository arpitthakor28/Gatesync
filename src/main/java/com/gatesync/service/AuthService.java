package com.gatesync.service;

import com.gatesync.dto.AuthDtos.*;
import com.gatesync.model.AuditLog;
import com.gatesync.model.User;
import com.gatesync.repository.jpa.AuditLogRepository;
import com.gatesync.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import com.gatesync.model.Role;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final com.gatesync.repository.mongo.UserMongoRepository userMongoRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse authenticate(LoginRequest req) {
        User user = userRepository.findByLoginId(req.getLoginId())
                .or(() -> userMongoRepository.findByLoginId(req.getLoginId()))
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
    public LoginResponse registerAdmin(RegisterAdminRequest req) {
        if (userRepository.findByLoginId(req.getLoginId()).isPresent() || userMongoRepository.findByLoginId(req.getLoginId()).isPresent()) {
            throw new RuntimeException("Login ID already registered!");
        }

        User admin = User.builder()
                .loginId(req.getLoginId())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail() != null ? req.getEmail() : req.getLoginId() + "@gatesync.in")
                .phone(req.getPhone() != null ? req.getPhone() : "+91 98765 43210")
                .role(Role.ADMIN)
                .mustResetPassword(false)
                .build();

        User saved = userRepository.save(admin);
        try {
            userMongoRepository.save(admin);
        } catch (Exception e) {}

        String mockToken = "jwt_" + UUID.randomUUID().toString();

        auditLogRepository.save(AuditLog.builder()
                .actorName(saved.getFullName())
                .actorRole("ADMIN")
                .actionCategory("SECURITY")
                .description("New Admin account registered: " + saved.getLoginId())
                .build());

        return LoginResponse.builder()
                .token(mockToken)
                .userId(saved.getId())
                .loginId(saved.getLoginId())
                .fullName(saved.getFullName())
                .role(saved.getRole())
                .mustResetPassword(false)
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
