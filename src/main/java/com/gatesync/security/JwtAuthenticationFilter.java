package com.gatesync.security;

import com.gatesync.model.User;
import com.gatesync.repository.jpa.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final com.gatesync.repository.mongo.UserMongoRepository userMongoRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip auth filter for public endpoints
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = getJwtFromRequest(request);

        if (jwt != null && tokenProvider.validateToken(jwt)) {
            String loginId = tokenProvider.getLoginIdFromToken(jwt);
            User user = userRepository.findByLoginId(loginId)
                    .or(() -> userMongoRepository.findByLoginId(loginId))
                    .orElse(null);

            if (user != null && user.isActive() && !user.isAccountLocked()) {
                CustomUserPrincipal principal = new CustomUserPrincipal(user);

                // Enforce forced password reset rule
                if (user.isMustResetPassword() && !isPasswordResetAllowedPath(path)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"timestamp\":\"" + java.time.LocalDateTime.now() + "\",\"status\":403,\"error\":\"Forbidden\",\"code\":\"PASSWORD_RESET_REQUIRED\",\"message\":\"Password reset is required before accessing resources.\",\"path\":\"" + path + "\"}");
                    return;
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        String tokenParam = request.getParameter("token");
        if (tokenParam != null && !tokenParam.isEmpty()) {
            return tokenParam;
        }
        return null;
    }

    private boolean isPublicPath(String path) {
        return path.equals("/") ||
               path.startsWith("/index.html") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.startsWith("/assets/") ||
               path.startsWith("/h2-console/") ||
               path.startsWith("/ws-gatesync") ||
               path.startsWith("/manifest.json") ||
               path.startsWith("/sw.js") ||
               path.equals("/api/auth/login") ||
               path.equals("/api/auth/register-admin") ||
               path.equals("/api/auth/forgot-password") ||
               path.equals("/api/auth/reset-password") ||
               path.equals("/api/health");
    }

    private boolean isPasswordResetAllowedPath(String path) {
        return path.equals("/api/auth/set-password") ||
               path.equals("/api/auth/logout") ||
               path.equals("/api/auth/me");
    }
}
