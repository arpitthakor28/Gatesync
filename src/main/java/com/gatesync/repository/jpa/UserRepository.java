package com.gatesync.repository.jpa;

import com.gatesync.model.Role;
import com.gatesync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);
    Optional<User> findByPhone(String phone);
    Optional<User> findByLoginIdOrPhone(String loginId, String phone);
    List<User> findByRole(Role role);
    Optional<User> findByBlockNumberAndFlatNumber(String blockNumber, String flatNumber);
}
