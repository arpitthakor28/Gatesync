package com.societysync.service;

import com.societysync.mongo.document.AuditLogDocument;
import com.societysync.mongo.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String societyId, Long userId, String loginId, String role, String action, String details, String ipAddress, String userAgent) {
        AuditLogDocument doc = new AuditLogDocument();
        doc.setSocietyId(societyId != null ? societyId : "SOC-101");
        doc.setUserId(userId);
        doc.setLoginId(loginId);
        doc.setRole(role);
        doc.setAction(action);
        doc.setDetails(details);
        doc.setIpAddress(ipAddress != null ? ipAddress : "0.0.0.0");
        doc.setUserAgent(userAgent);
        doc.setTimestamp(Instant.now());
        auditLogRepository.save(doc);
    }

    public List<AuditLogDocument> getAuditLogs(String societyId, int page, int size) {
        return auditLogRepository.findBySocietyIdOrderByTimestampDesc(societyId, PageRequest.of(page, size));
    }
}
