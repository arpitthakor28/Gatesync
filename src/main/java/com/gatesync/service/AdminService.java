package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.AdminDtos.*;
import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import com.gatesync.repository.mongo.UserMongoRepository;
import com.gatesync.repository.mongo.VisitorRequestMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * User and VisitorRequest reads/writes are Mongo-only - see AuthService for why
 * (H2 is in-memory and gets wiped on every Render cold start after idle spin-down).
 * This is what caused resident/guard accounts created via createUser() to silently
 * disappear.
 *
 * Flat, ClubhouseBooking, CommunityProblem, and AuditLog are intentionally still on
 * H2/JPA for now (out of scope for this fix) - they carry the same latent dual-
 * persistence bug and should get the same treatment, but that wasn't part of the
 * reported symptom (account creation / visitor requests / alerting).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserMongoRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestMongoRepository visitorRequestRepository;
    private final com.gatesync.repository.jpa.ClubhouseBookingRepository clubhouseBookingRepository;
    private final com.gatesync.repository.mongo.ClubhouseBookingMongoRepository clubhouseBookingMongoRepository;
    private final com.gatesync.repository.jpa.CommunityProblemRepository communityProblemRepository;
    private final com.gatesync.repository.mongo.CommunityProblemMongoRepository communityProblemMongoRepository;
    private final AuditLogRepository auditLogRepository;
    private final MongoSequenceService sequenceService;
    private final PasswordEncoder passwordEncoder;

    public DashboardStats getDashboardStats() {
        long totalResidents = userRepository.findByRole(Role.RESIDENT).size();
        long activeGuards = userRepository.findByRole(Role.GUARD).size();
        long totalFlats = flatRepository.count();

        List<VisitorRequest> allRequests = visitorRequestRepository.findAll();
        long pending = allRequests.stream().filter(r -> r.getStatus() == VisitorStatus.PENDING).count();

        LocalDate today = LocalDate.now();
        long todayCount = allRequests.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().toLocalDate().isEqual(today))
                .count();

        long approvedToday = allRequests.stream()
                .filter(r -> r.getStatus() == VisitorStatus.APPROVED && r.getCreatedAt() != null && r.getCreatedAt().toLocalDate().isEqual(today))
                .count();

        long deniedToday = allRequests.stream()
                .filter(r -> r.getStatus() == VisitorStatus.DENIED && r.getCreatedAt() != null && r.getCreatedAt().toLocalDate().isEqual(today))
                .count();

        return DashboardStats.builder()
                .totalResidents(totalResidents)
                .activeGuards(activeGuards)
                .totalFlats(totalFlats)
                .visitorsToday(todayCount)
                .pendingRequests(pending)
                .approvedToday(approvedToday)
                .deniedToday(deniedToday)
                .build();
    }

    public User createUser(CreateUserRequest req) {
        Role role = Role.valueOf(req.getRole().toUpperCase());

        if (userRepository.findByLoginId(req.getLoginId()).isPresent()) {
            throw new RuntimeException("Login ID already registered!");
        }

        User user = User.builder()
                .id(sequenceService.nextId("users"))
                .loginId(req.getLoginId())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .role(role)
                .blockNumber(req.getBlockNumber())
                .flatNumber(req.getFlatNumber())
                .shiftSchedule(req.getShiftSchedule())
                .gateAssigned(req.getGateAssigned())
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();

        // Synchronous save, exception propagates - if this throws, the admin sees
        // the actual error instead of a fake "account created" response.
        User saved = userRepository.save(user);
        log.info("Saved {} user to MongoDB: {}", saved.getRole(), saved.getLoginId());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName("Admin System")
                    .actorRole("ADMIN")
                    .actionCategory("USER_MGMT")
                    .description("Created new " + role.name() + " account: " + saved.getFullName() + " (" + saved.getLoginId() + ")")
                    .build());
        } catch (Exception e) {
            log.warn("Audit log write failed on user creation for {}: {}", saved.getLoginId(), e.getMessage());
        }

        return saved;
    }

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    public List<Flat> getAllFlats() {
        return flatRepository.findAll();
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public void clearAllData() {
        List<User> nonAdmins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN || (!"admin".equalsIgnoreCase(u.getLoginId())))
                .collect(java.util.stream.Collectors.toList());
        if (!nonAdmins.isEmpty()) {
            userRepository.deleteAll(nonAdmins);
        }
        visitorRequestRepository.deleteAll();

        try {
            clubhouseBookingMongoRepository.deleteAll();
            communityProblemMongoRepository.deleteAll();
        } catch (Exception e) {
            log.warn("MongoDB clear exception (clubhouse/community): {}", e.getMessage());
        }

        clubhouseBookingRepository.deleteAll();
        communityProblemRepository.deleteAll();
        auditLogRepository.deleteAll();

        log.info("All resident/guard accounts, visitor requests, and related data cleared.");
    }
}
