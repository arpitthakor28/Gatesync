package com.gatesync.repository.mongo;

import com.gatesync.model.ClubhouseBooking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubhouseBookingMongoRepository extends MongoRepository<ClubhouseBooking, Long> {
    List<ClubhouseBooking> findByFlat(String flat);
    List<ClubhouseBooking> findBySocietyIdOrderByCreatedAtDesc(String societyId);
    List<ClubhouseBooking> findByResidentNameOrderByCreatedAtDesc(String residentName);
}

