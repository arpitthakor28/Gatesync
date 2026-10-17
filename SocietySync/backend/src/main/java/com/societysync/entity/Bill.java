package com.societysync.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bill")
@Getter
@Setter
@NoArgsConstructor
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flatNumber;

    // e.g. "2026-09" - one bill per flat per month
    @Column(nullable = false)
    private String billingMonth;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status = BillStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod = PaymentMethod.NONE;

    private Instant paidAt;

    // Set when an admin marks a bill paid in cash; null for resident-initiated online payments
    private String collectedByAdminLoginId;

    private Instant dueDate;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
