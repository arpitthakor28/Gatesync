package com.gatesync.repository.mongo;

import com.gatesync.model.Role;
import com.gatesync.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserMongoRepository extends MongoRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);
    Optional<User> findByPhone(String phone);
    Optional<User> findByLoginIdOrPhone(String loginId, String phone);
    List<User> findByRole(Role role);
    Optional<User> findByBlockNumberAndFlatNumber(String blockNumber, String flatNumber);
}
