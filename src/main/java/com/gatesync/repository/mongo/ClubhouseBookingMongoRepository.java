package com.gatesync.repository.mongo;

import com.gatesync.model.ClubhouseBooking;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ClubhouseBookingMongoRepository extends MongoRepository<ClubhouseBooking, Long> {
    List<ClubhouseBooking> findByFlat(String flat);
}
