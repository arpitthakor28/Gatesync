package com.gatesync.repository.mongo;

import com.gatesync.model.Society;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocietyMongoRepository extends MongoRepository<Society, String> {
    Optional<Society> findBySocietyId(String societyId);
}
