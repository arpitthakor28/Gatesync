package com.gatesync.repository.mongo;

import com.gatesync.model.VisitorRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface VisitorRequestMongoRepository extends MongoRepository<VisitorRequest, Long> {
    List<VisitorRequest> findByTargetFlat(String targetFlat);
    List<VisitorRequest> findByStatus(String status);
}
