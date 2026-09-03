package com.gatesync.repository.mongo;

import com.gatesync.model.Flat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlatMongoRepository extends MongoRepository<Flat, String> {
    List<Flat> findBySocietyId(String societyId);
    List<Flat> findByBlock(String block);
}
