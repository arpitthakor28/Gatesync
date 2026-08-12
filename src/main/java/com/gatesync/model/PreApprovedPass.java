package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Entity
@Table(name = "pre_approved_passes")
@Document(collection = "pre_approved_passes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreApprovedPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    private String passCode;
    private String guestName;
    private String guestPhone;
    private String category; // Delivery, Cab, Frequent Guest, Service
    private String residentFlat;
    private String residentName;
    private LocalDateTime validUntil;
    private boolean used;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
