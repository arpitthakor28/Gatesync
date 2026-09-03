package com.gatesync.service;

import com.gatesync.config.MongoSequenceService;
import com.gatesync.model.AuditLog;
import com.gatesync.model.ClubhouseBooking;
import com.gatesync.model.NotificationCategory;
import com.gatesync.model.NotificationPriority;
import com.gatesync.notification.NotificationService;
import com.gatesync.repository.mongo.AuditLogMongoRepository;
import com.gatesync.repository.mongo.ClubhouseBookingMongoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClubhouseService {

    private final ClubhouseBookingMongoRepository clubhouseBookingRepository;
    private final AuditLogMongoRepository auditLogRepository;
    private final NotificationService notificationService;
    private final MongoSequenceService sequenceService;

    public ClubhouseBooking createBooking(ClubhouseBooking booking) {
        if (booking.getId() == null) {
            booking.setId(sequenceService.nextId("clubhouse_bookings"));
        }
        if (booking.getStatus() == null || booking.getStatus().isEmpty()) {
            booking.setStatus("PENDING");
        }
        if (booking.getSocietyId() == null || booking.getSocietyId().isEmpty()) {
            booking.setSocietyId("SOC-101");
        }

        ClubhouseBooking saved = clubhouseBookingRepository.save(booking);
        log.info("✅ Saved clubhouse booking to MongoDB: {}", saved.getTitle());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName(saved.getResidentName() != null ? saved.getResidentName() : "Resident")
                    .actorRole("RESIDENT")
                    .actionCategory("CLUBHOUSE")
                    .description("Submitted Clubhouse Booking request: '" + saved.getTitle() + "' at " + saved.getVenue())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log save failed: {}", e.getMessage());
        }

        // Notify admin of new booking
        notificationService.createCategoryNotification(
                "🎉 New Clubhouse Booking Request",
                (saved.getResidentName() != null ? saved.getResidentName() : "Resident") + " requested " + saved.getVenue() + " for '" + saved.getTitle() + "' on " + saved.getDate(),
                NotificationCategory.CLUBHOUSE,
                NotificationPriority.NORMAL,
                "ADMIN",
                null
        );

        return saved;
    }

    public List<ClubhouseBooking> getAllBookings(String societyId) {
        String effectiveSociety = (societyId != null && !societyId.isEmpty()) ? societyId : "SOC-101";
        return clubhouseBookingRepository.findBySocietyIdOrderByCreatedAtDesc(effectiveSociety);
    }

    public List<ClubhouseBooking> getBookingsForResident(String residentName) {
        return clubhouseBookingRepository.findByResidentNameOrderByCreatedAtDesc(residentName);
    }

    public ClubhouseBooking updateBookingStatus(Long id, String status, String reason) {
        ClubhouseBooking booking = clubhouseBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clubhouse booking not found"));

        booking.setStatus(status);
        if (reason != null && !reason.isEmpty()) {
            booking.setRejectionReason(reason);
        }

        ClubhouseBooking updated = clubhouseBookingRepository.save(booking);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorName("Admin System")
                    .actorRole("ADMIN")
                    .actionCategory("CLUBHOUSE")
                    .description("Updated Clubhouse Booking ID " + id + " status to " + status)
                    .build());
        } catch (Exception e) {
            log.warn("Audit log save failed: {}", e.getMessage());
        }

        // Notify resident of booking decision
        notificationService.createCategoryNotification(
                (status.equalsIgnoreCase("APPROVED") ? "✅ Clubhouse Booking Approved" : "❌ Clubhouse Booking Status: " + status),
                "Your booking for '" + updated.getTitle() + "' at " + updated.getVenue() + " has been " + status.toLowerCase() + ".",
                NotificationCategory.CLUBHOUSE,
                NotificationPriority.NORMAL,
                "RESIDENT",
                updated.getFlat()
        );

        return updated;
    }
}
