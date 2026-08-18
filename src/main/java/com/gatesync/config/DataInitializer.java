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

    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final PreApprovedPassRepository preApprovedPassRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        String societyId = "SOC-101";

        // 1. Primary Society
        Society society = Society.builder()
                .societyId(societyId)
                .name("Greenfield Heights Cooperative Housing Society")
                .address("124 Park Avenue, Powai")
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400076")
                .totalBlocks(2)
                .totalFlats(4)
                .contactPhone("+91 22 2840 9988")
                .adminEmail("admin@gatesync.in")
                .build();
        societyRepository.save(society);

        // 2. Flats Directory
        Flat[] flats = new Flat[] {
            Flat.builder().societyId(societyId).block("A").flatNumber("101").ownerName("Amit Patel").ownerPhone("9876543210").occupied(true).build(),
            Flat.builder().societyId(societyId).block("A").flatNumber("102").ownerName("Flat Owner").ownerPhone("9822011223").occupied(true).build(),
            Flat.builder().societyId(societyId).block("B").flatNumber("101").ownerName("Flat Owner").ownerPhone("9855566778").occupied(true).build()
        };
        for (Flat f : flats) {
            flatRepository.save(f);
        }

        // 3. Essential Seed Accounts ONLY (Admin, Guard, Resident)
        User admin = User.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("123"))
                .fullName("System Admin")
                .email("admin@gatesync.in")
                .phone("9999999999")
                .role(Role.ADMIN)
                .societyId(societyId)
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(admin);

        User guard = User.builder()
                .loginId("guard")
                .password(passwordEncoder.encode("123"))
                .fullName("Bahadur Thapa")
                .email("guard@gatesync.in")
                .phone("9812345678")
                .role(Role.GUARD)
                .societyId(societyId)
                .gateAssigned("Main Gate A")
                .shiftSchedule("DAY")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(guard);

        User resident = User.builder()
                .loginId("resident")
                .password(passwordEncoder.encode("123"))
                .fullName("Amit Patel")
                .email("resident@gatesync.in")
                .phone("9876543210")
                .role(Role.RESIDENT)
                .societyId(societyId)
                .blockNumber("A")
                .flatNumber("101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident);

        // 4. Initial Audit Log
        AuditLog log = AuditLog.builder()
                .societyId(societyId)
                .actorName("System Admin")
                .actorRole("ADMIN")
                .actionCategory("SECURITY")
                .description("GateSync Society Database Initialized with essential accounts.")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
}
