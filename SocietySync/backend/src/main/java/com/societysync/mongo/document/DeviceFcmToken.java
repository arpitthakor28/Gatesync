package com.societysync.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "device_fcm_tokens")
@CompoundIndexes({
        @CompoundIndex(name = "idx_user_society", def = "{'userId': 1, 'societyId': 1}"),
        @CompoundIndex(name = "idx_society_role", def = "{'societyId': 1, 'role': 1}")
})
@Getter
@Setter
@NoArgsConstructor
public class DeviceFcmToken {

    @Id
    private String id;

    @Indexed
    private Long userId;

    private String loginId;

    @Indexed
    private String societyId;

    private String role;

    private String flatNumber;

    @Indexed(unique = true)
    private String fcmToken;

    private String deviceName;

    private String userAgent;

    private Instant createdAt = Instant.now();

    private Instant lastActiveAt = Instant.now();
}
