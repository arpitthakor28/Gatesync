package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.model.AuditLog;
import com.gatesync.model.CommunityProblem;
import com.gatesync.model.NotificationCategory;
import com.gatesync.model.NotificationPriority;
import com.gatesync.notification.NotificationService;
import com.gatesync.repository.mongo.AuditLogMongoRepository;
import com.gatesync.repository.mongo.CommunityProblemMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunityProblemService {

    private final CommunityProblemMongoRepository communityProblemRepository;
    private final AuditLogMongoRepository auditLogRepository;
    private final NotificationService notificationService;
    private final MongoSequenceService sequenceService;

    public CommunityProblem reportProblem(CommunityProblem problem) {
        if (problem.getId() == null) {
            problem.setId(sequenceService.nextId("community_problems"));
        }
        if (problem.getStatus() == null || problem.getStatus().isEmpty()) {
            problem.setStatus("PENDING");
        }
        if (problem.getSocietyId() == null || problem.getSocietyId().isEmpty()) {
            problem.setSocietyId("SOC-101");
        }

        CommunityProblem saved = communityProblemRepository.save(problem);
        log.info("✅ Saved community problem to MongoDB: {}", saved.getTitle());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(saved.getReporterName() != null ? saved.getReporterName() : "Resident")
                    .actorRole("RESIDENT")
                    .actionCategory("COMMUNITY_ISSUE")
                    .description("Reported community problem: '" + saved.getTitle() + "' in category " + saved.getCategory())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log save failed: {}", e.getMessage());
        }

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

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName("Admin System")
                    .actorRole("ADMIN")
                    .actionCategory("COMMUNITY_ISSUE")
                    .description("Marked community problem ID " + id + " ('" + updated.getTitle() + "') as RESOLVED")
                    .build());
        } catch (Exception e) {
            log.warn("Audit log save failed: {}", e.getMessage());
        }

        // Notify resident/community of resolution
        notificationService.createCategoryNotification(
                "✅ Issue Resolved: " + updated.getTitle(),
                "Admin reply: " + updated.getAdminReply(),
                NotificationCategory.COMPLAINT,
                NotificationPriority.NORMAL,
                "RESIDENT",
                updated.getFlat()
        );

        return updated;
    }

    public void deleteProblem(Long id) {
        communityProblemRepository.deleteById(id);
        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName("Admin System")
                    .actorRole("ADMIN")
                    .actionCategory("COMMUNITY_ISSUE")
                    .description("Deleted community problem ID " + id)
                    .build());
        } catch (Exception e) {
            log.warn("Audit log save failed: {}", e.getMessage());
        }
    }
}
