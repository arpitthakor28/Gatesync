package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Entity
@Table(name = "societies")
@Document(collection = "societies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Society {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    @Column(nullable = false, unique = true)
    private String societyId; // e.g. "SOC-101"

    @Column(nullable = false)
    private String name; // e.g. "Greenfield Heights Cooperative Housing Society"

    private String address;
    private String city;
    private String state;
    private String pincode;

    @Builder.Default
    private int totalBlocks = 2;

    @Builder.Default
    private int totalFlats = 8;

    private String contactPhone;
    private String adminEmail;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
