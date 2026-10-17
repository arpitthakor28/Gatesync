package com.societysync.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "visitor_request")
@Getter
@Setter
@NoArgsConstructor
public class VisitorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String societyId = "SOC-101";

    @Column(nullable = false)
    private String visitorName;

    private String visitorPhone;
    private String vehicleNumber;
    private String purpose;
    private String photoUrl;

    @Column(nullable = false)
    private String flatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitorStatus status = VisitorStatus.PENDING;

    @Column(nullable = false)
    private String createdByGuardLoginId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant respondedAt;
    private Instant checkedOutAt;

    private String respondedByLoginId;
    private String denialReason;
}
