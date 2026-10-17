package com.societysync.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String loginId; // e.g. admin, A101 (flat-based for residents), guard1

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String fullName;

    private String mobile;

    // Only meaningful for RESIDENT role
    private String flatNumber;

    @Column(nullable = false)
    private boolean mustResetPassword = false;

    @Column(nullable = false)
    private boolean active = true;

    private Instant createdAt = Instant.now();
}
