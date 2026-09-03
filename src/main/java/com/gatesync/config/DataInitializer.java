package com.gatesync.config;

import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import com.gatesync.repository.mongo.UserMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * The admin seed account is written to Mongo (via UserMongoRepository) since that is
 * now the sole source of truth for User records - see AuthService/AdminService.
 * Checking/seeding against the JPA UserRepository here would seed an account that
 * AuthService can never find, and would re-seed on every restart since H2's count()
 * always resets to 0.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SocietyRepository societyRepository;
    private final UserMongoRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final PreApprovedPassRepository preApprovedPassRepository;
    private final AuditLogRepository auditLogRepository;
    private final MongoSequenceService sequenceService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
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

            // 2. Essential Seed Account ONLY (System Admin)
            // Testing residents and guards removed so Resident and Guard counts start at zero.
            User admin = User.builder()
                    .id(sequenceService.nextId("users"))
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

            // 3. Initial Audit Log
            AuditLog log = AuditLog.builder()
                    .societyId(societyId)
                    .actorName("System Admin")
                    .actorRole("ADMIN")
                    .actionCategory("SECURITY")
                    .description("GateSync Society Database Initialized with System Admin account. Resident and Guard counts starting at zero.")
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("[DataInitializer] Non-fatal warning: Data initialization skipped due to exception: " + e.getMessage());
        }
    }
}
