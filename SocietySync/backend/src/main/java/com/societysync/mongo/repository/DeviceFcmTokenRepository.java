package com.societysync.mongo.repository;

import com.societysync.mongo.document.DeviceFcmToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceFcmTokenRepository extends MongoRepository<DeviceFcmToken, String> {

    Optional<DeviceFcmToken> findByFcmToken(String fcmToken);

    List<DeviceFcmToken> findByUserId(Long userId);

    List<DeviceFcmToken> findByUserIdAndSocietyId(Long userId, String societyId);

    List<DeviceFcmToken> findBySocietyIdAndRole(String societyId, String role);

    List<DeviceFcmToken> findBySocietyIdAndFlatNumber(String societyId, String flatNumber);

    void deleteByFcmToken(String fcmToken);

    void deleteByUserId(Long userId);
}
