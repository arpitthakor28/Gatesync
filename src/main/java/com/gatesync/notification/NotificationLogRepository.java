package com.gatesync.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByVisitorRequestId(Long visitorRequestId);

    boolean existsByVisitorRequestIdAndChannelAndPurposeAndStatusIn(
            Long visitorRequestId,
            NotificationChannel channel,
            NotificationPurpose purpose,
            List<NotificationStatus> statuses
    );
}
