package com.societysync.service;

import com.societysync.entity.RefreshToken;
import com.societysync.entity.User;
import com.societysync.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

/**
 * Opaque, random, DB-backed refresh tokens (not JWTs) - this is deliberate.
 * A JWT refresh token can't be revoked without a blocklist; a DB row can just be
 * deleted/flagged, which is what makes "stay logged in until I log out" actually safe.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                                @Value("${app.jwt.refresh-token-days}") long refreshTokenDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenDays = refreshTokenDays;
    }

    public String issue(User user, String deviceInfo) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(rawToken));
        entity.setExpiryDate(Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));
        entity.setDeviceInfo(deviceInfo);
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    public Optional<User> validateAndRotate(String rawToken, String[] newTokenOut) {
        String tokenHash = hash(rawToken);
        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash);
        if (found.isEmpty()) return Optional.empty();

        RefreshToken existing = found.get();
        if (existing.getExpiryDate().isBefore(Instant.now())) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            return Optional.empty();
        }

        // Rotate: revoke the used one, issue a fresh one (mitigates replay of a stolen token)
        existing.setRevoked(true);
        refreshTokenRepository.save(existing);
        newTokenOut[0] = issue(existing.getUser(), existing.getDeviceInfo());
        return Optional.of(existing.getUser());
    }

    public void revokeAllForUser(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[64];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
