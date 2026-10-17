package com.societysync.repository;

import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface VisitorRequestRepository extends JpaRepository<VisitorRequest, Long> {
    List<VisitorRequest> findByFlatNumberAndStatusOrderByCreatedAtDesc(String flatNumber, VisitorStatus status);
    List<VisitorRequest> findByCreatedByGuardLoginIdOrderByCreatedAtDesc(String guardLoginId);
    List<VisitorRequest> findByStatusAndCreatedAtBefore(VisitorStatus status, Instant cutoff);
}
