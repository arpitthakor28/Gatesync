package com.societysync.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
public class NotificationPreferenceDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private Long userId;

    private String loginId;

    private String societyId;

    private boolean soundEnabled = true;

    private boolean vibrationEnabled = true;

    private boolean quietHoursEnabled = false;

    private String quietHoursStart = "22:00";

    private String quietHoursEnd = "07:00";

    private boolean allowVisitors = true;

    private boolean allowDeliveries = true;

    private boolean allowNotices = true;

    private Instant updatedAt = Instant.now();
}
