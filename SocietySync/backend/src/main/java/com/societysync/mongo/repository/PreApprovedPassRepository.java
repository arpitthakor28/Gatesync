package com.societysync.mongo.repository;

import com.societysync.mongo.document.PreApprovedPassDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PreApprovedPassRepository extends MongoRepository<PreApprovedPassDocument, String> {

    Optional<PreApprovedPassDocument> findByPassCodeAndSocietyId(String passCode, String societyId);

    Optional<PreApprovedPassDocument> findByPassCode(String passCode);

    List<PreApprovedPassDocument> findBySocietyIdAndFlatNumberOrderByCreatedAtDesc(String societyId, String flatNumber);

    List<PreApprovedPassDocument> findBySocietyIdAndFlatNumberAndUsedFalseAndValidUntilAfter(String societyId, String flatNumber, Instant now);

    List<PreApprovedPassDocument> findBySocietyIdOrderByCreatedAtDesc(String societyId);
}
