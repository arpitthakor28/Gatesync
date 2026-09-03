package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.dto.AdminDtos.*;
import com.gatesync.model.*;
import com.gatesync.repository.mongo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserMongoRepository userRepository;
    private final FlatMongoRepository flatRepository;
    private final VisitorRequestMongoRepository visitorRequestRepository;
    private final ClubhouseBookingMongoRepository clubhouseBookingRepository;
    private final CommunityProblemMongoRepository communityProblemRepository;
    private final AuditLogMongoRepository auditLogRepository;
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
            log.warn("Audit log write failed: {}", e.getMessage());
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
        clubhouseBookingRepository.deleteAll();
        communityProblemRepository.deleteAll();
        auditLogRepository.deleteAll();

        log.info("All resident/guard accounts, visitor requests, and related data cleared from MongoDB.");
    }
}
