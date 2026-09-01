package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
@Document(collection = "emergency_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    @Builder.Default
    private String societyId = "SOC-101";

    @Column(nullable = false)
    private String emergencyType; // MEDICAL, FIRE, SECURITY, GATE_DISTURBANCE, GENERAL

    @Column(nullable = false)
    private String callerName;

    private String callerRole;
    private String callerPhone;
    private String blockNumber;
    private String flatNumber;
    private String gateName;
    private String note;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ACKNOWLEDGED, RESOLVED

    private String acknowledgedBy;
    private LocalDateTime acknowledgedAt;

    private String resolvedBy;
    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
