package com.gatesync.repository.mongo;

import com.gatesync.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogMongoRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByTimestampDesc();
}
