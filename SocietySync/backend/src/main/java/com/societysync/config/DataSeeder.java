package com.societysync.config;

import com.societysync.entity.Role;
import com.societysync.entity.User;
import com.societysync.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates a default admin (admin / admin123) on first boot against an empty DB so the
 * app is usable immediately. Change this password immediately in anything beyond local dev.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByLoginId("admin")) return;

        User admin = new User();
        admin.setLoginId("admin");
        admin.setFullName("Society Admin");
        admin.setMobile("9999999999");
        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setMustResetPassword(true);
        userRepository.save(admin);

        System.out.println("=========================================================");
        System.out.println(" Seeded default admin -> loginId: admin | password: admin123");
        System.out.println(" You will be forced to change this on first login.");
        System.out.println("=========================================================");
    }
}
