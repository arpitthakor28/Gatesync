package com.societysync.service;

import com.societysync.dto.AuthResponse;
import com.societysync.dto.LoginRequest;
import com.societysync.entity.User;
import com.societysync.repository.UserRepository;
import com.societysync.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public AuthResponse login(LoginRequest request, String deviceInfo) {
        User user = userRepository.findByLoginId(request.loginId())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid login ID or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid login ID or password");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getLoginId(), user.getRole().name());
        String refreshToken = refreshTokenService.issue(user, deviceInfo);

        return new AuthResponse(accessToken, refreshToken, user.getRole().name(),
                user.getLoginId(), user.getFullName(), user.isMustResetPassword());
    }

    public AuthResponse refresh(String rawRefreshToken) {
        String[] newTokenHolder = new String[1];
        User user = refreshTokenService.validateAndRotate(rawRefreshToken, newTokenHolder)
                .orElseThrow(() -> new BadCredentialsException("Refresh token invalid or expired - please log in again"));

        String accessToken = jwtUtil.generateAccessToken(user.getLoginId(), user.getRole().name());
        return new AuthResponse(accessToken, newTokenHolder[0], user.getRole().name(),
                user.getLoginId(), user.getFullName(), user.isMustResetPassword());
    }

    public void logout(Long userId) {
        refreshTokenService.revokeAllForUser(userId);
    }

    public void logoutByLoginId(String loginId) {
        userRepository.findByLoginId(loginId).ifPresent(u -> refreshTokenService.revokeAllForUser(u.getId()));
    }
}
