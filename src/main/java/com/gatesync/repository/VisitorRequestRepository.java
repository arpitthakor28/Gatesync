package com.gatesync.repository;

import com.gatesync.model.VisitorRequest;
import com.gatesync.model.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitorRequestRepository extends JpaRepository<VisitorRequest, Long> {
    List<VisitorRequest> findByTargetBlockAndTargetFlatOrderByCreatedAtDesc(String targetBlock, String targetFlat);
    List<VisitorRequest> findByStatusOrderByCreatedAtDesc(VisitorStatus status);
    List<VisitorRequest> findAllByOrderByCreatedAtDesc();
}
