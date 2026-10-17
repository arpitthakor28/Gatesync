package com.societysync.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * Short-lived access tokens only. Persistent login is handled by the separate,
 * DB-backed, revocable refresh token (see RefreshTokenService) - never by making
 * this JWT itself long-lived, which would make logout/revocation impossible.
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long accessTokenMillis;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.access-token-minutes}") long accessTokenMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMillis = accessTokenMinutes * 60 * 1000;
    }

    public String generateAccessToken(String loginId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenMillis);
        return Jwts.builder()
                .subject(loginId)
                .claims(Map.of("role", role))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractLoginId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }
}
