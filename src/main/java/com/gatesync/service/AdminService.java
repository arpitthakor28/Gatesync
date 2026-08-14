package com.gatesync.service;

import com.gatesync.dto.AdminDtos.*;
import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final com.gatesync.repository.mongo.UserMongoRepository userMongoRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final AuditLogRepository auditLogRepository;
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

    @Transactional
    public User createUser(CreateUserRequest req) {
        Role role = Role.valueOf(req.getRole().toUpperCase());
        User user = User.builder()
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
                .mustResetPassword(true)
                .build();

        User saved = userRepository.save(user);
        try {
            userMongoRepository.save(user);
        } catch (Exception e) {}

        auditLogRepository.save(AuditLog.builder()
                .actorName("Admin System")
                .actorRole("ADMIN")
                .actionCategory("USER_MGMT")
                .description("Created new " + role.name() + " account in DB & MongoDB Atlas: " + saved.getFullName() + " (" + saved.getLoginId() + ")")
                .build());

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
}
