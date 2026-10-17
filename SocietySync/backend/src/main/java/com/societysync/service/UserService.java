package com.societysync.service;

import com.societysync.dto.CreateGuardRequest;
import com.societysync.dto.CreateResidentRequest;
import com.societysync.entity.Flat;
import com.societysync.entity.Role;
import com.societysync.entity.User;
import com.societysync.repository.FlatRepository;
import com.societysync.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Mirrors GateSync's onboarding pattern: login IDs and temp passwords are generated,
 * not chosen, and a forced reset happens on first login.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, FlatRepository flatRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createResident(CreateResidentRequest req) {
        flatRepository.findByFlatNumber(req.flatNumber()).orElseGet(() -> {
            Flat flat = new Flat();
            flat.setFlatNumber(req.flatNumber());
            flat.setOwnerName(req.fullName());
            flat.setOwnerMobile(req.mobile());
            return flatRepository.save(flat);
        });

        String loginId = req.flatNumber();
        if (userRepository.existsByLoginId(loginId)) {
            throw new IllegalStateException("A resident already exists for flat " + req.flatNumber());
        }

        User user = new User();
        user.setLoginId(loginId);
        user.setFullName(req.fullName());
        user.setMobile(req.mobile());
        user.setFlatNumber(req.flatNumber());
        user.setRole(Role.RESIDENT);
        user.setPasswordHash(passwordEncoder.encode(tempPasswordFromMobile(req.mobile())));
        user.setMustResetPassword(true);
        return userRepository.save(user);
    }

    public User createGuard(CreateGuardRequest req) {
        if (userRepository.existsByLoginId(req.loginId())) {
            throw new IllegalStateException("Login ID already taken");
        }
        User user = new User();
        user.setLoginId(req.loginId());
        user.setFullName(req.fullName());
        user.setMobile(req.mobile());
        user.setRole(Role.GUARD);
        user.setPasswordHash(passwordEncoder.encode(tempPasswordFromMobile(req.mobile())));
        user.setMustResetPassword(true);
        return userRepository.save(user);
    }

    public void resetPassword(String loginId, String newPassword) {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustResetPassword(false);
        userRepository.save(user);
    }

    // Temp password = last 6 digits of mobile number, same convention as GateSync
    private String tempPasswordFromMobile(String mobile) {
        String digits = mobile.replaceAll("\\D", "");
        return digits.length() >= 6 ? digits.substring(digits.length() - 6) : digits;
    }
}
