package com.societysync.config;

import com.societysync.entity.Role;
import com.societysync.entity.User;
import com.societysync.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        // Seed Admin
        if (!userRepository.existsByLoginId("admin")) {
            User admin = new User();
            admin.setLoginId("admin");
            admin.setFullName("Society Admin");
            admin.setMobile("9999999999");
            admin.setSocietyId("SOC-101");
            admin.setRole(Role.ADMIN);
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setMustResetPassword(false);
            userRepository.save(admin);
        }

        // Seed Resident (A-101)
        if (!userRepository.existsByLoginId("A101")) {
            User resident = new User();
            resident.setLoginId("A101");
            resident.setFullName("Rahul Verma");
            resident.setMobile("9876543210");
            resident.setFlatNumber("A-101");
            resident.setSocietyId("SOC-101");
            resident.setRole(Role.RESIDENT);
            resident.setPasswordHash(passwordEncoder.encode("resident123"));
            resident.setMustResetPassword(false);
            userRepository.save(resident);
        }

        // Seed Security Guard
        if (!userRepository.existsByLoginId("guard1")) {
            User guard = new User();
            guard.setLoginId("guard1");
            guard.setFullName("Suresh Singh (Gate 1)");
            guard.setMobile("9876543222");
            guard.setSocietyId("SOC-101");
            guard.setRole(Role.GUARD);
            guard.setPasswordHash(passwordEncoder.encode("guard123"));
            guard.setMustResetPassword(false);
            userRepository.save(guard);
        }

        System.out.println("=========================================================");
        System.out.println(" [GateSync] Initial Database Seed Complete:");
        System.out.println(" - ADMIN:    admin    / admin123    (Society SOC-101)");
        System.out.println(" - RESIDENT: A101     / resident123 (Flat A-101, SOC-101)");
        System.out.println(" - GUARD:    guard1   / guard123    (Gate 1, SOC-101)");
        System.out.println("=========================================================");
    }
}
