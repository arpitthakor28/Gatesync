package com.gatesync.repository.jpa;

import com.gatesync.model.ClubhouseBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubhouseBookingRepository extends JpaRepository<ClubhouseBooking, Long> {
    List<ClubhouseBooking> findBySocietyIdOrderByCreatedAtDesc(String societyId);
    List<ClubhouseBooking> findByResidentNameOrderByCreatedAtDesc(String residentName);
}
