package com.gatesync.repository.jpa;

import com.gatesync.model.VisitorRequest;
import com.gatesync.model.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface VisitorRequestRepository extends JpaRepository<VisitorRequest, Long> {
    List<VisitorRequest> findByTargetBlockAndTargetFlatOrderByCreatedAtDesc(String targetBlock, String targetFlat);
    List<VisitorRequest> findByStatusOrderByCreatedAtDesc(VisitorStatus status);
    List<VisitorRequest> findByStatusAndCreatedAtBefore(VisitorStatus status, LocalDateTime cutoff);
    List<VisitorRequest> findAllByOrderByCreatedAtDesc();
}
