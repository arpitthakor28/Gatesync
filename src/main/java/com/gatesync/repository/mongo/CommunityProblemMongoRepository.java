package com.gatesync.repository.mongo;

import com.gatesync.model.CommunityProblem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityProblemMongoRepository extends MongoRepository<CommunityProblem, Long> {
    List<CommunityProblem> findByCategory(String category);
    List<CommunityProblem> findBySocietyIdOrderByCreatedAtDesc(String societyId);
    List<CommunityProblem> findByReporterNameOrderByCreatedAtDesc(String reporterName);
}

