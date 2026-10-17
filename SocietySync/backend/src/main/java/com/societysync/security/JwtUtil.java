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
import java.util.HashMap;
import java.util.Map;

/**
 * Short-lived access tokens (15 mins). Verified claims contain identity, role,
 * societyId and flatNumber.
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long accessTokenMillis;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.access-token-minutes:15}") long accessTokenMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMillis = accessTokenMinutes * 60 * 1000;
    }

    public String generateAccessToken(Long userId, String loginId, String role, String societyId,
                                      String flatNumber, String fullName) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenMillis);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("societyId", societyId != null ? societyId : "SOC-101");
        if (flatNumber != null) claims.put("flatNumber", flatNumber);
        if (fullName != null) claims.put("fullName", fullName);

        return Jwts.builder()
                .subject(loginId)
                .claims(claims)
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

    public Long extractUserId(String token) {
        Object val = parseClaims(token).get("userId");
        if (val instanceof Number n) return n.longValue();
        return null;
    }

    public String extractSocietyId(String token) {
        String val = parseClaims(token).get("societyId", String.class);
        return val != null ? val : "SOC-101";
    }

    public String extractFlatNumber(String token) {
        return parseClaims(token).get("flatNumber", String.class);
    }

    public String extractFullName(String token) {
        return parseClaims(token).get("fullName", String.class);
    }
}
