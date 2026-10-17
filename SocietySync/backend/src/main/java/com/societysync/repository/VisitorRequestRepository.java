package com.societysync.repository;

import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VisitorRequestRepository extends JpaRepository<VisitorRequest, Long> {
    List<VisitorRequest> findBySocietyIdAndFlatNumberAndStatusOrderByCreatedAtDesc(String societyId, String flatNumber, VisitorStatus status);
    List<VisitorRequest> findBySocietyIdAndStatusOrderByCreatedAtDesc(String societyId, VisitorStatus status);
    List<VisitorRequest> findBySocietyIdOrderByCreatedAtDesc(String societyId);
    Optional<VisitorRequest> findByIdAndSocietyId(Long id, String societyId);
    List<VisitorRequest> findByStatusAndCreatedAtBefore(VisitorStatus status, Instant cutoff);
}
