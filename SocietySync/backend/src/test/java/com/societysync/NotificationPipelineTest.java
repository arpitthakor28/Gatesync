package com.societysync;

import com.societysync.dto.NotificationEvent;
import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import com.societysync.mongo.document.DeviceFcmToken;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.repository.DeviceFcmTokenRepository;
import com.societysync.mongo.repository.NotificationMongoRepository;
import com.societysync.repository.VisitorRequestRepository;
import com.societysync.service.NotificationService;
import com.societysync.service.VisitorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationPipelineTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationMongoRepository notificationRepository;

    @Autowired
    private DeviceFcmTokenRepository deviceTokenRepository;

    @Autowired
    private VisitorService visitorService;

    @Autowired
    private VisitorRequestRepository visitorRequestRepository;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        deviceTokenRepository.deleteAll();
        visitorRequestRepository.deleteAll();
    }

    @Test
    @DisplayName("Deduplication: Duplicate event with same dedupeKey does not dispatch twice")
    void testDeduplicationPreventsDoubleAlert() {
        String dedupeKey = "visitor_req_test_999";

        NotificationEvent event1 = new NotificationEvent(
                "SOC-101",
                101L,
                "A101",
                "A-101",
                NotificationDocument.NotificationType.VISITOR_REQUEST,
                NotificationDocument.NotificationPriority.CRITICAL,
                "Visitor Arrived",
                "Visitor 1 waiting",
                Map.of("requestId", 999L),
                dedupeKey,
                Instant.now().plusSeconds(120)
        );

        NotificationDocument doc1 = notificationService.dispatch(event1);
        assertNotNull(doc1.getId());

        NotificationEvent event2 = new NotificationEvent(
                "SOC-101",
                101L,
                "A101",
                "A-101",
                NotificationDocument.NotificationType.VISITOR_REQUEST,
                NotificationDocument.NotificationPriority.CRITICAL,
                "Visitor Arrived Again",
                "Visitor 1 duplicate",
                Map.of("requestId", 999L),
                dedupeKey, // Same dedupeKey
                Instant.now().plusSeconds(120)
        );

        NotificationDocument doc2 = notificationService.dispatch(event2);
        // Must return the exact same persisted document id
        assertEquals(doc1.getId(), doc2.getId());
        assertEquals("Visitor Arrived", doc2.getTitle());
    }

    @Test
    @DisplayName("Atomic Decision: Double decisions are rejected with IllegalStateException (maps to 409 Conflict)")
    void testAtomicDecisionRejectsDoubleSubmission() {
        VisitorRequestCreateDto dto = new VisitorRequestCreateDto(
                "Swiggy Delivery",
                "9876543210",
                null,
                "Food Delivery",
                null,
                "A-101"
        );
        VisitorRequest request = visitorService.createRequest(dto, "guard1", "SOC-101");
        assertNotNull(request.getId());

        // First decision: Approved
        VisitorRequest approved = visitorService.decide(
                request.getId(),
                true,
                null,
                "A101",
                "SOC-101",
                "A-101"
        );
        assertEquals(VisitorStatus.APPROVED, approved.getStatus());

        // Second decision on already-resolved request must throw IllegalStateException
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            visitorService.decide(
                    request.getId(),
                    false,
                    "Changed mind",
                    "A101",
                    "SOC-101",
                    "A-101"
            );
        });

        assertTrue(ex.getMessage().contains("already been resolved"));
    }

    @Test
    @DisplayName("Token Cleanup: Unregistered/invalid FCM token is removed from repository")
    void testStaleFcmTokenCleanup() {
        DeviceFcmToken token = new DeviceFcmToken();
        token.setUserId(101L);
        token.setLoginId("A101");
        token.setSocietyId("SOC-101");
        token.setFcmToken("stale_invalid_fcm_token_12345");
        token.setDeviceName("Old Android Phone");
        deviceTokenRepository.save(token);

        assertTrue(deviceTokenRepository.findByFcmToken("stale_invalid_fcm_token_12345").isPresent());

        // Simulate token cleanup trigger
        deviceTokenRepository.deleteByFcmToken("stale_invalid_fcm_token_12345");
        assertTrue(deviceTokenRepository.findByFcmToken("stale_invalid_fcm_token_12345").isEmpty());
    }
}
