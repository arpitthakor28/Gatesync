package com.gatesync.config;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Generates auto-incrementing Long IDs for Mongo documents that previously relied on
 * JPA's @GeneratedValue(IDENTITY) via H2. MongoRepository does not auto-generate Long
 * ids, so any entity that switches to Mongo as its primary store must call
 * nextId(collectionName) before save() to avoid null/duplicate-key errors.
 *
 * Uses an atomic findAndModify against a "database_sequences" collection, so it's safe
 * under concurrent requests (e.g. two guards registering visitors at the same time).
 */
@Service
@RequiredArgsConstructor
public class MongoSequenceService {

    private final MongoOperations mongoOperations;

    public long nextId(String sequenceName) {
        DatabaseSequence counter = mongoOperations.findAndModify(
                Query.query(where("_id").is(sequenceName)),
                new Update().inc("seq", 1),
                FindAndModifyOptions.options().returnNew(true).upsert(true),
                DatabaseSequence.class
        );
        return counter != null ? counter.getSeq() : 1L;
    }

    @Getter
    @Setter
    public static class DatabaseSequence {
        private String id;
        private long seq;
    }
}
