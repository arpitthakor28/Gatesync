package com.societysync.service;

import com.societysync.dto.AuthResponse;
import com.societysync.dto.LoginRequest;
import com.societysync.dto.SessionDto;
import com.societysync.entity.User;
import com.societysync.repository.UserRepository;
import com.societysync.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        JwtUtil jwtUtil, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
        User user = userRepository.findByLoginId(request.loginId())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid login ID or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid login ID or password");
        }

        String accessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getLoginId(),
                user.getRole().name(),
                user.getSocietyId(),
                user.getFlatNumber(),
                user.getFullName()
        );
        String refreshToken = refreshTokenService.issue(user, deviceInfo, ipAddress);

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getLoginId(),
                user.getRole().name(),
                user.getSocietyId(),
                user.getFlatNumber(),
                user.getFullName(),
                user.isMustResetPassword()
        );
    }

    public AuthResponse refresh(String rawRefreshToken, String ipAddress) {
        String[] newTokenHolder = new String[1];
        User user = refreshTokenService.validateAndRotate(rawRefreshToken, ipAddress, newTokenHolder)
                .orElseThrow(() -> new BadCredentialsException("Refresh token invalid or expired - please log in again"));

        String accessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getLoginId(),
                user.getRole().name(),
                user.getSocietyId(),
                user.getFlatNumber(),
                user.getFullName()
        );

        return new AuthResponse(
                accessToken,
                newTokenHolder[0],
                user.getId(),
                user.getLoginId(),
                user.getRole().name(),
                user.getSocietyId(),
                user.getFlatNumber(),
                user.getFullName(),
                user.isMustResetPassword()
        );
    }

    public List<SessionDto> getSessions(Long userId, String currentRawToken) {
        return refreshTokenService.listSessions(userId, currentRawToken);
    }

    public boolean revokeSession(Long sessionId, Long userId) {
        return refreshTokenService.revokeSession(sessionId, userId);
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeByRawToken(rawRefreshToken);
    }

    public void logoutAll(Long userId) {
        refreshTokenService.revokeAllForUser(userId);
    }
}
