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

@Document(collection = "escalation_tasks")
@CompoundIndexes({
        @CompoundIndex(name = "idx_pending_trigger", def = "{'executed': 1, 'triggerAt': 1}"),
        @CompoundIndex(name = "idx_request_stage", def = "{'requestId': 1, 'stage': 1}")
})
@Getter
@Setter
@NoArgsConstructor
public class EscalationTaskDocument {

    @Id
    private String id;

    @Indexed
    private String societyId;

    @Indexed
    private Long requestId;

    private String flatNumber;

    private EscalationStage stage;

    @Indexed
    private Instant triggerAt;

    private boolean executed = false;

    private Instant createdAt = Instant.now();

    private Instant executedAt;

    public enum EscalationStage {
        REMINDER_60S,
        NO_RESPONSE_120S,
        EXPIRE_TIMEOUT
    }
}
