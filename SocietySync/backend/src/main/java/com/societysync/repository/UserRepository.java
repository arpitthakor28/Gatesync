package com.societysync.repository;

import com.societysync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
    Optional<User> findByFlatNumber(String flatNumber);
    Optional<User> findBySocietyIdAndFlatNumber(String societyId, String flatNumber);
}
