package com.gatesync.repository.mongo;

import com.gatesync.model.EmergencyAlert;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface EmergencyAlertMongoRepository extends MongoRepository<EmergencyAlert, Long> {
    List<EmergencyAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<EmergencyAlert> findAllByOrderByCreatedAtDesc();
}
