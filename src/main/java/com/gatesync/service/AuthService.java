package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.AuthDtos.*;
import com.gatesync.model.AuditLog;
import com.gatesync.model.Role;
import com.gatesync.model.User;
import com.gatesync.repository.jpa.AuditLogRepository;
import com.gatesync.repository.mongo.UserMongoRepository;
import com.gatesync.security.CustomUserPrincipal;
import com.gatesync.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * User accounts (login, registration, password reset) are stored ONLY in MongoDB.
 * Do not reintroduce the JPA/H2 UserRepository here - H2 is in-memory and gets wiped
 * on every server restart (which on Render's free tier happens on every cold start
 * after idle spin-down), which is what caused accounts and logins to silently vanish.
 *
 * AuditLog is intentionally still on H2/JPA for now (out of scope for this fix) -
 * it does not affect login/account-creation correctness, only audit history durability.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserMongoRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final MongoSequenceService sequenceService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public LoginResponse authenticate(LoginRequest req) {
        String input = (req.getLoginId() != null ? req.getLoginId() : "").trim();
        String cleanPhone = input.replaceAll("[^0-9]", "");
        User user = userRepository.findByLoginId(input)
                .or(() -> userRepository.findByPhone(input))
                .or(() -> cleanPhone.length() >= 7 ? userRepository.findByPhone(cleanPhone) : java.util.Optional.empty())
                .or(() -> userRepository.findByLoginIdOrPhone(input, input))
                .or(() -> {
                    if (input.contains("-")) {
                        String[] parts = input.split("-");
                        return userRepository.findByBlockNumberAndFlatNumber(parts[0].trim(), parts[1].trim());
                    }
                    return userRepository.findByBlockNumberAndFlatNumber("A", input);
                })
                .orElse(null);

        if (user == null) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account disabled. Please contact administrator.");
        }

        if (user.isAccountLocked()) {
            throw new RuntimeException("Account locked. Please contact administrator.");
        }

        String jwtToken = tokenProvider.generateToken(user);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(user.getFullName())
                    .actorRole(user.getRole().name())
                    .actionCategory("SECURITY")
                    .description("User logged in successfully via ID: " + user.getLoginId())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on login for {}: {}", user.getLoginId(), e.getMessage());
        }

        return LoginResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .loginId(user.getLoginId())
                .fullName(user.getFullName())
                .role(user.getRole())
                .societyId(user.getSocietyId() != null ? user.getSocietyId() : "SOC-101")
                .blockNumber(user.getBlockNumber())
                .flatNumber(user.getFlatNumber())
                .mustResetPassword(user.isMustResetPassword())
                .build();
    }

    public LoginResponse registerAdmin(RegisterAdminRequest req) {
        if (userRepository.findByLoginId(req.getLoginId()).isPresent()) {
            throw new RuntimeException("Login ID already registered!");
        }

        User admin = User.builder()
                .id(sequenceService.nextId("users"))
                .loginId(req.getLoginId())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail() != null ? req.getEmail() : req.getLoginId() + "@gatesync.in")
                .phone(req.getPhone() != null ? req.getPhone() : "+91 98765 43210")
                .role(Role.ADMIN)
                .societyId(req.getSocietyName() != null && !req.getSocietyName().isEmpty() ? req.getSocietyName() : "SOC-101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();

        // Synchronous save, exception propagates instead of being swallowed - if this
        // throws, the caller gets a real error instead of a fake "success" response.
        User saved = userRepository.save(admin);
        log.info("Saved Admin user to MongoDB: {}", saved.getLoginId());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(saved.getFullName())
                    .actorRole("ADMIN")
                    .actionCategory("SECURITY")
                    .description("New Admin account registered: " + saved.getLoginId())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on admin registration for {}: {}", saved.getLoginId(), e.getMessage());
        }

        String jwtToken = tokenProvider.generateToken(saved);

        return LoginResponse.builder()
                .token(jwtToken)
                .userId(saved.getId())
                .loginId(saved.getLoginId())
                .fullName(saved.getFullName())
                .role(saved.getRole())
                .societyId(saved.getSocietyId())
                .mustResetPassword(false)
                .build();
    }

    public ApiResponse resetPassword(PasswordResetRequest req) {
        User user = null;
        if (req.getUserId() != null) {
            user = userRepository.findById(req.getUserId()).orElse(null);
        }
        if (user == null && req.getUsername() != null && !req.getUsername().trim().isEmpty()) {
            String uname = req.getUsername().trim();
            user = userRepository.findByLoginId(uname)
                    .or(() -> userRepository.findByPhone(uname))
                    .orElse(null);
        }
        if (user == null) {
            throw new RuntimeException("User not found for password reset");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setMustResetPassword(false);
        userRepository.save(user);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(user.getFullName())
                    .actorRole(user.getRole() != null ? user.getRole().name() : "USER")
                    .actionCategory("SECURITY")
                    .description("Password successfully updated and verified for: " + user.getLoginId())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on password reset for {}: {}", user.getLoginId(), e.getMessage());
        }

        return new ApiResponse(true, "Password updated successfully!");
    }

    public ApiResponse setPassword(CustomUserPrincipal principal, PasswordResetRequest req) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getCurrentPassword() != null && !req.getCurrentPassword().isEmpty()) {
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password does not match!");
            }
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setMustResetPassword(false);
        userRepository.save(user);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(user.getFullName())
                    .actorRole(user.getRole().name())
                    .actionCategory("SECURITY")
                    .description("Password updated via forced/authenticated reset flow.")
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on setPassword for {}: {}", user.getLoginId(), e.getMessage());
        }

        return new ApiResponse(true, "Password set successfully!");
    }

    public LoginResponse getMe(CustomUserPrincipal principal) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwtToken = tokenProvider.generateToken(user);

        return LoginResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .loginId(user.getLoginId())
                .fullName(user.getFullName())
                .role(user.getRole())
                .societyId(user.getSocietyId() != null ? user.getSocietyId() : "SOC-101")
                .blockNumber(user.getBlockNumber())
                .flatNumber(user.getFlatNumber())
                .mustResetPassword(user.isMustResetPassword())
                .build();
    }
}
