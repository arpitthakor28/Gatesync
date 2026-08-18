package com.gatesync.config;

import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final PreApprovedPassRepository preApprovedPassRepository;
    private final ClubhouseBookingRepository clubhouseBookingRepository;
    private final CommunityProblemRepository communityProblemRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        String societyId = "SOC-101";

        // 1. Seed Primary Society Entity
        Society society = Society.builder()
                .societyId(societyId)
                .name("Greenfield Heights Cooperative Housing Society")
                .address("124 Park Avenue, Powai")
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400076")
                .totalBlocks(2)
                .totalFlats(8)
                .contactPhone("+91 22 2840 9988")
                .adminEmail("admin@gatesync.in")
                .build();
        societyRepository.save(society);

        // 2. Seed Society Flats Directory
        Flat[] flats = new Flat[] {
            Flat.builder().societyId(societyId).block("A").flatNumber("101").ownerName("Amit Patel").ownerPhone("9876543210").occupied(true).build(),
            Flat.builder().societyId(societyId).block("A").flatNumber("102").ownerName("Sanjay Gupta").ownerPhone("9822011223").tenantName("Rohan Verma").tenantPhone("9811122334").occupied(true).build(),
            Flat.builder().societyId(societyId).block("A").flatNumber("201").ownerName("Priya Sharma").ownerPhone("9833344556").occupied(true).build(),
            Flat.builder().societyId(societyId).block("A").flatNumber("202").ownerName("Vikram Malhotra").ownerPhone("9844455667").occupied(true).build(),
            Flat.builder().societyId(societyId).block("B").flatNumber("101").ownerName("Rajesh Mehta").ownerPhone("9855566778").occupied(true).build(),
            Flat.builder().societyId(societyId).block("B").flatNumber("102").ownerName("Kavita Rao").ownerPhone("9866677889").occupied(true).build(),
            Flat.builder().societyId(societyId).block("B").flatNumber("201").ownerName("Anil Deshmukh").ownerPhone("9877788990").occupied(true).build(),
            Flat.builder().societyId(societyId).block("B").flatNumber("202").ownerName("Neha Joshi").ownerPhone("9888899001").occupied(true).build()
        };
        for (Flat f : flats) {
            flatRepository.save(f);
        }

        // 3. Seed Users (Admin, Guards, Residents)
        User admin = User.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("123"))
                .fullName("System Admin")
                .email("admin@gatesync.in")
                .phone("9999999999")
                .role(Role.ADMIN)
                .societyId(societyId)
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(admin);

        User guard1 = User.builder()
                .loginId("guard")
                .password(passwordEncoder.encode("123"))
                .fullName("Bahadur Thapa")
                .email("guard@gatesync.in")
                .phone("9812345678")
                .role(Role.GUARD)
                .societyId(societyId)
                .gateAssigned("Main Gate A")
                .shiftSchedule("DAY")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(guard1);

        User guard2 = User.builder()
                .loginId("guard2")
                .password(passwordEncoder.encode("123"))
                .fullName("Ramesh Yadav")
                .email("guard2@gatesync.in")
                .phone("9812345679")
                .role(Role.GUARD)
                .societyId(societyId)
                .gateAssigned("Service Gate B")
                .shiftSchedule("NIGHT")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(guard2);

        User resident1 = User.builder()
                .loginId("resident")
                .password(passwordEncoder.encode("123"))
                .fullName("Amit Patel")
                .email("resident@gatesync.in")
                .phone("9876543210")
                .role(Role.RESIDENT)
                .societyId(societyId)
                .blockNumber("A")
                .flatNumber("101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident1);

        User resident2 = User.builder()
                .loginId("resident2")
                .password(passwordEncoder.encode("123"))
                .fullName("Rohan Verma")
                .email("rohan@gatesync.in")
                .phone("9811122334")
                .role(Role.RESIDENT)
                .societyId(societyId)
                .blockNumber("A")
                .flatNumber("102")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident2);

        User resident3 = User.builder()
                .loginId("resident3")
                .password(passwordEncoder.encode("123"))
                .fullName("Priya Sharma")
                .email("priya@gatesync.in")
                .phone("9833344556")
                .role(Role.RESIDENT)
                .societyId(societyId)
                .blockNumber("A")
                .flatNumber("201")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident3);

        User resident4 = User.builder()
                .loginId("resident4")
                .password(passwordEncoder.encode("123"))
                .fullName("Rajesh Mehta")
                .email("rajesh@gatesync.in")
                .phone("9855566778")
                .role(Role.RESIDENT)
                .societyId(societyId)
                .blockNumber("B")
                .flatNumber("101")
                .mustResetPassword(false)
                .active(true)
                .accountLocked(false)
                .build();
        userRepository.save(resident4);

        // 4. Seed Visitor Requests
        VisitorRequest v1 = VisitorRequest.builder()
                .societyId(societyId)
                .visitorName("Swiggy Delivery Executive")
                .visitorPhone("9870011223")
                .purpose("Delivery")
                .vehicleNumber("MH-02-CD-4421")
                .photoUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80")
                .targetBlock("A")
                .targetFlat("101")
                .gateName("Main Gate A")
                .guardName("Bahadur Thapa")
                .status(VisitorStatus.APPROVED)
                .checkInTime(LocalDateTime.now().minusHours(2))
                .build();
        visitorRequestRepository.save(v1);

        VisitorRequest v2 = VisitorRequest.builder()
                .societyId(societyId)
                .visitorName("Urban Company Electrician")
                .visitorPhone("9870099887")
                .purpose("Plumber / Service")
                .vehicleNumber("MH-04-AB-1200")
                .photoUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80")
                .targetBlock("A")
                .targetFlat("102")
                .gateName("Main Gate A")
                .guardName("Bahadur Thapa")
                .status(VisitorStatus.CHECKED_IN)
                .checkInTime(LocalDateTime.now().minusMinutes(45))
                .build();
        visitorRequestRepository.save(v2);

        VisitorRequest v3 = VisitorRequest.builder()
                .societyId(societyId)
                .visitorName("Unverified Guest")
                .visitorPhone("9870033445")
                .purpose("Guest")
                .photoUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80")
                .targetBlock("B")
                .targetFlat("101")
                .gateName("Service Gate B")
                .guardName("Ramesh Yadav")
                .status(VisitorStatus.DENIED)
                .denialReason("Resident refused entry confirmation.")
                .respondedAt(LocalDateTime.now().minusHours(4))
                .build();
        visitorRequestRepository.save(v3);

        VisitorRequest v4 = VisitorRequest.builder()
                .societyId(societyId)
                .visitorName("Amazon Delivery Driver")
                .visitorPhone("9870066778")
                .purpose("Delivery")
                .photoUrl("https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80")
                .targetBlock("A")
                .targetFlat("101")
                .gateName("Main Gate A")
                .guardName("Bahadur Thapa")
                .status(VisitorStatus.PENDING)
                .build();
        visitorRequestRepository.save(v4);

        // 5. Seed Pre-Approved Visitor Passes
        PreApprovedPass pass1 = PreApprovedPass.builder()
                .societyId(societyId)
                .passCode("GS-881923")
                .guestName("Deepak Verma")
                .guestPhone("9899988877")
                .category("Cab / Guest")
                .residentFlat("A-101")
                .residentName("Amit Patel")
                .validUntil(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();
        preApprovedPassRepository.save(pass1);

        PreApprovedPass pass2 = PreApprovedPass.builder()
                .societyId(societyId)
                .passCode("GS-441209")
                .guestName("Sunil Courier Service")
                .guestPhone("9877711122")
                .category("Delivery")
                .residentFlat("B-101")
                .residentName("Rajesh Mehta")
                .validUntil(LocalDateTime.now().plusHours(12))
                .used(false)
                .build();
        preApprovedPassRepository.save(pass2);

        // 6. Seed Clubhouse Bookings
        ClubhouseBooking booking1 = ClubhouseBooking.builder()
                .societyId(societyId)
                .residentName("Amit Patel")
                .flat("A-101")
                .title("Family Birthday Celebration")
                .type("Birthday")
                .venue("Clubhouse Hall")
                .date("2026-08-25")
                .startTime("18:00")
                .endTime("22:00")
                .guests(35)
                .notes("Decorations and catering arranged privately.")
                .status("APPROVED")
                .build();
        clubhouseBookingRepository.save(booking1);

        ClubhouseBooking booking2 = ClubhouseBooking.builder()
                .societyId(societyId)
                .residentName("Priya Sharma")
                .flat("A-201")
                .title("Society Managing Committee Quarterly Meeting")
                .type("Meeting")
                .venue("Main Lawn")
                .date("2026-09-01")
                .startTime("10:00")
                .endTime("13:00")
                .guests(20)
                .notes("Audio system required.")
                .status("APPROVED")
                .build();
        clubhouseBookingRepository.save(booking2);

        // 7. Seed Community Problem Posts
        CommunityProblem problem1 = CommunityProblem.builder()
                .societyId(societyId)
                .reporterName("Amit Patel")
                .flat("A-101")
                .title("Low Water Supply Pressure in Block A Upper Floors")
                .category("Water")
                .priority("High")
                .description("Water pressure in Unit A-101 and A-201 drops significantly during morning peak hours (7:00 AM - 9:00 AM).")
                .status("RESOLVED")
                .pinned(true)
                .adminReply("Plumber inspected and repaired water pressure booster pump 2 on August 17.")
                .build();
        communityProblemRepository.save(problem1);

        CommunityProblem problem2 = CommunityProblem.builder()
                .societyId(societyId)
                .reporterName("Rohan Verma")
                .flat("A-102")
                .title("Elevator B-2 Internal Lighting Failure")
                .category("Lift")
                .priority("Medium")
                .description("The cabin light inside Elevator B-2 flickers intermittently.")
                .status("APPROVED")
                .pinned(false)
                .adminReply("Maintenance ticket opened with Schindler elevator team.")
                .build();
        communityProblemRepository.save(problem2);

        // 8. Seed Security Audit Logs
        AuditLog log1 = AuditLog.builder()
                .societyId(societyId)
                .actorName("Bahadur Thapa")
                .actorRole("GUARD")
                .actionCategory("VISITOR_ENTRY")
                .description("Registered new visitor 'Amazon Delivery Driver' for Flat A-101")
                .timestamp(LocalDateTime.now().minusMinutes(5))
                .build();
        auditLogRepository.save(log1);

        AuditLog log2 = AuditLog.builder()
                .societyId(societyId)
                .actorName("Amit Patel")
                .actorRole("RESIDENT")
                .actionCategory("APPROVAL")
                .description("APPROVED entry request for visitor 'Swiggy Delivery Executive'")
                .timestamp(LocalDateTime.now().minusHours(2))
                .build();
        auditLogRepository.save(log2);

        AuditLog log3 = AuditLog.builder()
                .societyId(societyId)
                .actorName("System Admin")
                .actorRole("ADMIN")
                .actionCategory("SECURITY")
                .description("Greenfield Heights Society database schema initialized.")
                .timestamp(LocalDateTime.now().minusHours(12))
                .build();
        auditLogRepository.save(log3);
    }
}
