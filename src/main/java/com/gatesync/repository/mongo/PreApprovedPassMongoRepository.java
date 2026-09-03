package com.gatesync.repository.mongo;

import com.gatesync.model.PreApprovedPass;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreApprovedPassMongoRepository extends MongoRepository<PreApprovedPass, String> {
    Optional<PreApprovedPass> findByPassCode(String passCode);
    List<PreApprovedPass> findByResidentFlatOrderByCreatedAtDesc(String residentFlat);
}
