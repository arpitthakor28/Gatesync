package com.gatesync.repository.mongo;

import com.gatesync.model.VisitorRequest;
import com.gatesync.model.VisitorStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface VisitorRequestMongoRepository extends MongoRepository<VisitorRequest, Long> {
    List<VisitorRequest> findByTargetFlat(String targetFlat);
    List<VisitorRequest> findByStatus(String status);
    List<VisitorRequest> findByTargetBlockAndTargetFlatOrderByCreatedAtDesc(String targetBlock, String targetFlat);
    List<VisitorRequest> findByStatusOrderByCreatedAtDesc(VisitorStatus status);
    List<VisitorRequest> findByStatusAndCreatedAtBefore(VisitorStatus status, LocalDateTime cutoff);
    List<VisitorRequest> findAllByOrderByCreatedAtDesc();
}
