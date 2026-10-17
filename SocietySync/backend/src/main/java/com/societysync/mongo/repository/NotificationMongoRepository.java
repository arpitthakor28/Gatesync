package com.societysync.mongo.repository;

import com.societysync.mongo.document.NotificationDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationMongoRepository extends MongoRepository<NotificationDocument, String> {

    Optional<NotificationDocument> findByDedupeKey(String dedupeKey);

    List<NotificationDocument> findByRecipientUserIdAndStatusOrderByCreatedAtDesc(Long recipientUserId, NotificationDocument.NotificationStatus status);

    List<NotificationDocument> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId, Pageable pageable);

    List<NotificationDocument> findByRecipientUserIdAndSocietyIdOrderByCreatedAtDesc(Long recipientUserId, String societyId, Pageable pageable);

    List<NotificationDocument> findByRecipientUserIdAndSocietyIdAndTypeOrderByCreatedAtDesc(Long recipientUserId, String societyId, NotificationDocument.NotificationType type, Pageable pageable);

    long countByRecipientUserIdAndStatus(Long recipientUserId, NotificationDocument.NotificationStatus status);

    List<NotificationDocument> findBySocietyIdOrderByCreatedAtDesc(String societyId, Pageable pageable);

    List<NotificationDocument> findBySocietyIdAndStatusOrderByCreatedAtDesc(String societyId, NotificationDocument.NotificationStatus status, Pageable pageable);

    List<NotificationDocument> findBySocietyIdAndTypeOrderByCreatedAtDesc(String societyId, NotificationDocument.NotificationType type, Pageable pageable);
}
