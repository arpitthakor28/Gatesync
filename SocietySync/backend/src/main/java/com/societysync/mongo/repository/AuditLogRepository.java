package com.societysync.mongo.repository;

import com.societysync.mongo.document.AuditLogDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLogDocument, String> {

    List<AuditLogDocument> findBySocietyIdOrderByTimestampDesc(String societyId, Pageable pageable);

    List<AuditLogDocument> findBySocietyIdAndActionOrderByTimestampDesc(String societyId, String action, Pageable pageable);
}
