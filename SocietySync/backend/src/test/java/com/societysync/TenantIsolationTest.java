package com.societysync;

import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.Role;
import com.societysync.entity.User;
import com.societysync.entity.VisitorRequest;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.repository.NotificationMongoRepository;
import com.societysync.repository.UserRepository;
import com.societysync.repository.VisitorRequestRepository;
import com.societysync.service.NotificationService;
import com.societysync.service.VisitorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TenantIsolationTest {

    @Autowired
    private VisitorService visitorService;

    @Autowired
    private VisitorRequestRepository visitorRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationMongoRepository notificationRepository;

    @BeforeEach
    void setUp() {
        visitorRequestRepository.deleteAll();
    }

    @Test
    @DisplayName("Tenant Isolation: Guard from Society A cannot see or access visitor requests from Society B")
    void testGuardCannotAccessOtherSocietyVisitorQueue() {
        // Society A: Create request
        VisitorRequestCreateDto dtoSocA = new VisitorRequestCreateDto(
                "Visitor Alpha",
                "9876543210",
                "MH-01-1111",
                "Meeting",
                null,
                "A-101"
        );
        VisitorRequest reqSocA = visitorService.createRequest(dtoSocA, "guardA", "SOCIETY_A");

        // Society B: Create request
        VisitorRequestCreateDto dtoSocB = new VisitorRequestCreateDto(
                "Visitor Beta",
                "9876543222",
                "MH-02-2222",
                "Delivery",
                null,
                "B-202"
        );
        VisitorRequest reqSocB = visitorService.createRequest(dtoSocB, "guardB", "SOCIETY_B");

        // Society A guard checks queue
        List<VisitorRequest> queueSocA = visitorService.pendingForGuard("SOCIETY_A");
        assertEquals(1, queueSocA.size());
        assertEquals("Visitor Alpha", queueSocA.get(0).getVisitorName());
        assertFalse(queueSocA.stream().anyMatch(r -> "SOCIETY_B".equals(r.getSocietyId())));

        // Society B guard checks queue
        List<VisitorRequest> queueSocB = visitorService.pendingForGuard("SOCIETY_B");
        assertEquals(1, queueSocB.size());
        assertEquals("Visitor Beta", queueSocB.get(0).getVisitorName());
        assertFalse(queueSocB.stream().anyMatch(r -> "SOCIETY_A".equals(r.getSocietyId())));
    }

    @Test
    @DisplayName("Tenant Isolation: Resident in Flat A-101 in Society A cannot decide on Society B request")
    void testResidentCannotDecideOtherSocietyRequest() {
        VisitorRequestCreateDto dto = new VisitorRequestCreateDto(
                "Courier Guy",
                "9999988888",
                null,
                "Package",
                null,
                "A-101"
        );
        VisitorRequest reqSocB = visitorService.createRequest(dto, "guardB", "SOCIETY_B");

        // Resident with Flat A-101 attempts to decide on Society B's request using Society A credential
        assertThrows(NoSuchElementException.class, () -> {
            visitorService.decide(
                    reqSocB.getId(),
                    true,
                    null,
                    "residentA",
                    "SOCIETY_A", // Wrong society
                    "A-101"
            );
        });
    }

    @Test
    @DisplayName("Flat Isolation: Resident in Flat A-101 cannot approve visitor destined for Flat A-102")
    void testResidentCannotApproveOtherFlatVisitor() {
        VisitorRequestCreateDto dto = new VisitorRequestCreateDto(
                "Personal Guest",
                "9999977777",
                null,
                "Guest",
                null,
                "A-102" // Destined for A-102
        );
        VisitorRequest req = visitorService.createRequest(dto, "guard1", "SOC-101");

        // Resident of A-101 attempts to approve
        assertThrows(AccessDeniedException.class, () -> {
            visitorService.decide(
                    req.getId(),
                    true,
                    null,
                    "residentA101",
                    "SOC-101",
                    "A-101" // Resident is in A-101, but visitor is for A-102
            );
        });
    }

    @Test
    @DisplayName("Tenant Isolation: Society A user cannot view notifications belonging to Society B")
    void testNotificationFeedMultiTenantIsolation() {
        List<NotificationDocument> notifsSocA = notificationRepository.findBySocietyIdOrderByCreatedAtDesc("SOCIETY_A", PageRequest.of(0, 10));
        assertTrue(notifsSocA.stream().allMatch(n -> "SOCIETY_A".equals(n.getSocietyId())));
    }
}
