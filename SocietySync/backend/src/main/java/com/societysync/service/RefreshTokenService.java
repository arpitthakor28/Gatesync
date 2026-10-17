package com.societysync.service;

import com.societysync.dto.SessionDto;
import com.societysync.entity.RefreshToken;
import com.societysync.entity.User;
import com.societysync.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                                @Value("${app.jwt.refresh-token-days:30}") long refreshTokenDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenDays = refreshTokenDays;
    }

    @Transactional
    public String issue(User user, String deviceInfo, String ipAddress) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(rawToken));
        entity.setExpiryDate(Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));
        entity.setDeviceInfo(deviceInfo != null && !deviceInfo.isBlank() ? deviceInfo : "Unknown Browser / Device");
        entity.setIpAddress(ipAddress != null ? ipAddress : "0.0.0.0");
        entity.setCreatedAt(Instant.now());
        entity.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    @Transactional
    public Optional<User> validateAndRotate(String rawToken, String ipAddress, String[] newTokenOut) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();

        String tokenHash = hash(rawToken);
        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash);
        if (found.isEmpty()) return Optional.empty();

        RefreshToken existing = found.get();
        if (existing.getExpiryDate().isBefore(Instant.now())) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            return Optional.empty();
        }

        // Rotate: revoke the used token, issue a fresh one on the same device/session
        existing.setRevoked(true);
        existing.setLastUsedAt(Instant.now());
        if (ipAddress != null) existing.setIpAddress(ipAddress);
        refreshTokenRepository.save(existing);

        String newRaw = issue(existing.getUser(), existing.getDeviceInfo(), ipAddress);
        newTokenOut[0] = newRaw;
        return Optional.of(existing.getUser());
    }

    @Transactional(readOnly = true)
    public List<SessionDto> listSessions(Long userId, String currentRawToken) {
        String currentHash = currentRawToken != null ? hash(currentRawToken) : null;
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalseOrderByLastUsedAtDesc(userId);
        return tokens.stream().map(t -> new SessionDto(
                t.getId(),
                t.getDeviceInfo(),
                t.getIpAddress(),
                t.getCreatedAt(),
                t.getLastUsedAt(),
                currentHash != null && currentHash.equals(t.getTokenHash())
        )).toList();
    }

    @Transactional
    public boolean revokeSession(Long sessionId, Long userId) {
        Optional<RefreshToken> token = refreshTokenRepository.findByIdAndUserId(sessionId, userId);
        if (token.isPresent()) {
            RefreshToken t = token.get();
            t.setRevoked(true);
            refreshTokenRepository.save(t);
            return true;
        }
        return false;
    }

    @Transactional
    public void revokeByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        String tokenHash = hash(rawToken);
        refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[64];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
