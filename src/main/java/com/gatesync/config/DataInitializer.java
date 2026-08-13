package com.gatesync.config;

import com.gatesync.model.*;
import com.gatesync.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final PreApprovedPassRepository preApprovedPassRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        // 1. Create Default Users (Admin, Guards, Residents) with Indian +91 Phone Format
        User admin = User.builder()
                .loginId("admin")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Rajesh Sharma (Admin)")
                .email("admin@gatesync.in")
                .phone("+91 98765 43210")
                .role(Role.ADMIN)
                .mustResetPassword(false)
                .build();
        userRepository.save(admin);

        User guard1 = User.builder()
                .loginId("guard")
                .password(passwordEncoder.encode("guard123"))
                .fullName("Vikram Singh (Main Gate)")
                .email("guard1@gatesync.in")
                .phone("+91 98123 45678")
                .role(Role.GUARD)
                .shiftSchedule("DAY")
                .gateAssigned("Gate A - Main Entrance")
                .mustResetPassword(false)
                .build();
        userRepository.save(guard1);

        User guard2 = User.builder()
                .loginId("guard2")
                .password(passwordEncoder.encode("guard123"))
                .fullName("Ramesh Kumar (North Gate)")
                .email("guard2@gatesync.in")
                .phone("+91 98987 65432")
                .role(Role.GUARD)
                .shiftSchedule("NIGHT")
                .gateAssigned("Gate B - North Service")
                .mustResetPassword(false)
                .build();
        userRepository.save(guard2);

        User resident1 = User.builder()
                .loginId("resident")
                .password(passwordEncoder.encode("resident123"))
                .fullName("Amit Patel")
                .email("amit.patel@gmail.com")
                .phone("+91 99887 76655")
                .role(Role.RESIDENT)
                .blockNumber("A")
                .flatNumber("402")
                .mustResetPassword(false)
                .build();
        userRepository.save(resident1);

        User resident2 = User.builder()
                .loginId("res_a102")
                .password(passwordEncoder.encode("password123"))
                .fullName("Suresh Verma")
                .email("suresh.verma@gmail.com")
                .phone("+91 97654 32109")
                .role(Role.RESIDENT)
                .blockNumber("A")
                .flatNumber("102")
                .mustResetPassword(false)
                .build();
        userRepository.save(resident2);

        User resident3 = User.builder()
                .loginId("res_b405")
                .password(passwordEncoder.encode("password123"))
                .fullName("Priya Sharma")
                .email("priya.sharma@yahoo.com")
                .phone("+91 96543 21098")
                .role(Role.RESIDENT)
                .blockNumber("B")
                .flatNumber("405")
                .mustResetPassword(false)
                .build();
        userRepository.save(resident3);

        User resident4 = User.builder()
                .loginId("resident2")
                .password(passwordEncoder.encode("password123"))
                .fullName("Sunita Rao")
                .email("sunita.rao@society.org")
                .phone("+91 95432 10987")
                .role(Role.RESIDENT)
                .blockNumber("B")
                .flatNumber("105")
                .mustResetPassword(true) // Forced reset demo
                .build();
        userRepository.save(resident4);

        // 2. Seed Flats
        flatRepository.save(Flat.builder().block("A").flatNumber("402").ownerName("Amit Patel").ownerPhone("+91 99887 76655").occupied(true).build());
        flatRepository.save(Flat.builder().block("A").flatNumber("102").ownerName("Suresh Verma").ownerPhone("+91 97654 32109").occupied(true).build());
        flatRepository.save(Flat.builder().block("B").flatNumber("405").ownerName("Priya Sharma").ownerPhone("+91 96543 21098").occupied(true).build());
        flatRepository.save(Flat.builder().block("B").flatNumber("105").ownerName("Sunita Rao").ownerPhone("+91 95432 10987").occupied(true).build());
        flatRepository.save(Flat.builder().block("C").flatNumber("201").ownerName("Rohan Mehta").ownerPhone("+91 94321 09876").occupied(false).build());

        // Initialized with zero sample visitor requests, zero audit logs, zero pre-approved passes as requested.
    }
}
