package com.gatesync.config;

import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final PreApprovedPassRepository preApprovedPassRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        // 1. Create ONLY 1 Default Admin User
        User admin = User.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("admin123"))
                .fullName("System Admin")
                .email("admin@gatesync.in")
                .phone("+91 98765 43210")
                .role(Role.ADMIN)
                .mustResetPassword(false)
                .build();
        userRepository.save(admin);
    }
}
