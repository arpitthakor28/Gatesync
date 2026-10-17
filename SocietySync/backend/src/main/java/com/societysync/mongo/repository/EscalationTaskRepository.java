package com.societysync.mongo.repository;

import com.societysync.mongo.document.EscalationTaskDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EscalationTaskRepository extends MongoRepository<EscalationTaskDocument, String> {

    List<EscalationTaskDocument> findByExecutedFalseAndTriggerAtBefore(Instant cutoff);

    Optional<EscalationTaskDocument> findByRequestIdAndStage(Long requestId, EscalationTaskDocument.EscalationStage stage);

    List<EscalationTaskDocument> findByRequestId(Long requestId);

    void deleteByRequestId(Long requestId);
}
