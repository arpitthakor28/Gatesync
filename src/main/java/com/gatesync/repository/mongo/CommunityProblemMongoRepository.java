package com.gatesync.repository.mongo;

import com.gatesync.model.CommunityProblem;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommunityProblemMongoRepository extends MongoRepository<CommunityProblem, Long> {
    List<CommunityProblem> findByCategory(String category);
}
