package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_requests")
@Document(collection = "visitor_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    @Builder.Default
    private String societyId = "SOC-101";

    @Column(nullable = false)
    private String visitorName;

    @Column(nullable = false)
    private String visitorPhone;

    private String purpose; // Guest, Delivery, Cab, Service, Maintenance
    private String vehicleNumber;
    private String photoUrl;

    @Column(nullable = false)
    private String targetBlock;

    @Column(nullable = false)
    private String targetFlat;

    private String gateName;
    private String guardName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitorStatus status;

    private String denialReason;

    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
