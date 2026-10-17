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

@Document(collection = "audit_logs")
@CompoundIndexes({
        @CompoundIndex(name = "idx_society_action_time", def = "{'societyId': 1, 'action': 1, 'timestamp': -1}"),
        @CompoundIndex(name = "idx_society_time", def = "{'societyId': 1, 'timestamp': -1}")
})
@Getter
@Setter
@NoArgsConstructor
public class AuditLogDocument {

    @Id
    private String id;

    @Indexed
    private String societyId;

    private Long userId;

    private String loginId;

    private String role;

    @Indexed
    private String action; // SOS_TRIGGERED, VISITOR_APPROVED, VISITOR_REJECTED, PASS_GENERATED, PASS_REDEEMED, DEVICE_REVOKED

    private String details;

    private String ipAddress;

    private String userAgent;

    @Indexed
    private Instant timestamp = Instant.now();
}
