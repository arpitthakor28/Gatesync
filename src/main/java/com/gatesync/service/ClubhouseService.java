package com.gatesync.service;

import com.gatesync.model.AuditLog;
import com.gatesync.model.ClubhouseBooking;
import com.gatesync.repository.jpa.AuditLogRepository;
import com.gatesync.repository.jpa.ClubhouseBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubhouseService {

    private final ClubhouseBookingRepository clubhouseBookingRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public ClubhouseBooking createBooking(ClubhouseBooking booking) {
        if (booking.getStatus() == null || booking.getStatus().isEmpty()) {
            booking.setStatus("PENDING");
        }
        if (booking.getSocietyId() == null || booking.getSocietyId().isEmpty()) {
            booking.setSocietyId("SOC-101");
        }

        ClubhouseBooking saved = clubhouseBookingRepository.save(booking);

        auditLogRepository.save(AuditLog.builder()
                .actorName(saved.getResidentName() != null ? saved.getResidentName() : "Resident")
                .actorRole("RESIDENT")
                .actionCategory("CLUBHOUSE")
                .description("Submitted Clubhouse Booking request: '" + saved.getTitle() + "' at " + saved.getVenue())
                .build());

        return saved;
    }

    public List<ClubhouseBooking> getAllBookings(String societyId) {
        String effectiveSociety = (societyId != null && !societyId.isEmpty()) ? societyId : "SOC-101";
        return clubhouseBookingRepository.findBySocietyIdOrderByCreatedAtDesc(effectiveSociety);
    }

    public List<ClubhouseBooking> getBookingsForResident(String residentName) {
        return clubhouseBookingRepository.findByResidentNameOrderByCreatedAtDesc(residentName);
    }

    @Transactional
    public ClubhouseBooking updateBookingStatus(Long id, String status, String reason) {
        ClubhouseBooking booking = clubhouseBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clubhouse booking not found"));

        booking.setStatus(status);
        if (reason != null && !reason.isEmpty()) {
            booking.setRejectionReason(reason);
        }

        ClubhouseBooking updated = clubhouseBookingRepository.save(booking);

        auditLogRepository.save(AuditLog.builder()
                .actorName("Admin System")
                .actorRole("ADMIN")
                .actionCategory("CLUBHOUSE")
                .description("Updated Clubhouse Booking ID " + id + " status to " + status)
                .build());

        return updated;
    }
}
