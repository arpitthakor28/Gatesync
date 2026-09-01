package com.gatesync.service;

import com.gatesync.model.AuditLog;
import com.gatesync.model.CommunityProblem;
import com.gatesync.model.NotificationCategory;
import com.gatesync.model.NotificationPriority;
import com.gatesync.notification.NotificationService;
import com.gatesync.repository.jpa.AuditLogRepository;
import com.gatesync.repository.jpa.CommunityProblemRepository;
import com.gatesync.repository.mongo.CommunityProblemMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityProblemService {

    private final CommunityProblemRepository communityProblemRepository;
    private final CommunityProblemMongoRepository communityProblemMongoRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    @Transactional
    public CommunityProblem reportProblem(CommunityProblem problem) {
        if (problem.getStatus() == null || problem.getStatus().isEmpty()) {
            problem.setStatus("PENDING");
        }
        if (problem.getSocietyId() == null || problem.getSocietyId().isEmpty()) {
            problem.setSocietyId("SOC-101");
        }

        CommunityProblem saved = communityProblemRepository.save(problem);
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                communityProblemMongoRepository.save(saved);
                System.out.println("✅ [MongoDB Compass] Saved community problem: " + saved.getTitle());
            } catch (Exception e) {
                System.err.println("❌ [MongoDB Compass Error] " + e.getMessage());
            }
        });

        auditLogRepository.save(AuditLog.builder()
                .actorName(saved.getReporterName() != null ? saved.getReporterName() : "Resident")
                .actorRole("RESIDENT")
                .actionCategory("COMMUNITY_ISSUE")
                .description("Reported community problem: '" + saved.getTitle() + "' in category " + saved.getCategory())
                .build());

        // Notify Admin of new complaint
        notificationService.createCategoryNotification(
                "⚠️ New Community Problem Reported",
                (saved.getReporterName() != null ? saved.getReporterName() : "Resident") + " reported issue: " + saved.getTitle() + " (" + saved.getCategory() + ")",
                NotificationCategory.COMPLAINT,
                NotificationPriority.NORMAL,
                "ADMIN",
                null
        );

        return saved;
    }

    public List<CommunityProblem> getAllProblems(String societyId) {
        String effectiveSociety = (societyId != null && !societyId.isEmpty()) ? societyId : "SOC-101";
        return communityProblemRepository.findBySocietyIdOrderByCreatedAtDesc(effectiveSociety);
    }

    @Transactional
    public CommunityProblem resolveProblem(Long id, String adminReply) {
        CommunityProblem problem = communityProblemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Community problem not found"));

        problem.setStatus("RESOLVED");
        if (adminReply != null && !adminReply.isEmpty()) {
            problem.setAdminReply(adminReply);
        } else {
            problem.setAdminReply("Issue investigated and resolved by Admin team.");
        }

        CommunityProblem updated = communityProblemRepository.save(problem);

        auditLogRepository.save(AuditLog.builder()
                .actorName("Admin System")
                .actorRole("ADMIN")
                .actionCategory("COMMUNITY_ISSUE")
                .description("Marked community problem ID " + id + " ('" + updated.getTitle() + "') as RESOLVED")
                .build());

        // Notify resident/community of resolution
        notificationService.createCategoryNotification(
                "✅ Issue Resolved: " + updated.getTitle(),
                "Admin reply: " + updated.getAdminReply(),
                NotificationCategory.COMPLAINT,
                NotificationPriority.NORMAL,
                "RESIDENT",
                updated.getReporterFlat()
        );

        return updated;
    }

    @Transactional
    public void deleteProblem(Long id) {
        communityProblemRepository.deleteById(id);
        auditLogRepository.save(AuditLog.builder()
                .actorName("Admin System")
                .actorRole("ADMIN")
                .actionCategory("COMMUNITY_ISSUE")
                .description("Deleted community problem ID " + id)
                .build());
    }
}
