package com.gatesync.repository.mongo;

import com.gatesync.model.Role;
import com.gatesync.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserMongoRepository extends MongoRepository<User, String> {
    Optional<User> findByLoginId(String loginId);
    List<User> findByRole(Role role);
}
