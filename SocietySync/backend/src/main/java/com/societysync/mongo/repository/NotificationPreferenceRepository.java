package com.societysync.mongo.repository;

import com.societysync.mongo.document.NotificationPreferenceDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreferenceDocument, String> {

    Optional<NotificationPreferenceDocument> findByUserId(Long userId);

    Optional<NotificationPreferenceDocument> findByUserIdAndSocietyId(Long userId, String societyId);
}
