package com.gatesync.repository.mongo;

import com.gatesync.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationMongoRepository extends MongoRepository<Notification, Long> {
    List<Notification> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);
    List<Notification> findByTargetRoleInOrderByCreatedAtDesc(List<String> targetRoles);
    List<Notification> findByTargetFlatOrderByCreatedAtDesc(String targetFlat);
    List<Notification> findAllByOrderByCreatedAtDesc();
    long countByTargetUserIdAndIsReadFalse(Long targetUserId);
}
