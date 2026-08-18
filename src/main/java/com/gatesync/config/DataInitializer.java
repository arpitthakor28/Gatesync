package com.gatesync.config;

import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        // 1. Create Default Admin User
        User admin = User.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("123"))
                .fullName("System Admin")
                .email("admin@gatesync.in")
                .phone("9999999999")
                .role(Role.ADMIN)
                .societyId("SOC-101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(admin);

        // 2. Create Default Resident User
        User resident = User.builder()
                .loginId("resident")
                .password(passwordEncoder.encode("123"))
                .fullName("Amit Patel")
                .email("resident@gatesync.in")
                .phone("9876543210")
                .role(Role.RESIDENT)
                .societyId("SOC-101")
                .blockNumber("A")
                .flatNumber("101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident);

        // 3. Create Default Guard User
        User guard = User.builder()
                .loginId("guard")
                .password(passwordEncoder.encode("123"))
                .fullName("Bahadur Thapa")
                .email("guard@gatesync.in")
                .phone("9812345678")
                .role(Role.GUARD)
                .societyId("SOC-101")
                .gateAssigned("Main Gate A")
                .shiftSchedule("DAY")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(guard);
    }
}
