package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Entity
@Table(name = "clubhouse_bookings")
@Document(collection = "clubhouse_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubhouseBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    private String residentName;
    private String flat;
    private String title;
    private String type; // Birthday, Meeting, Festival, Family Function, Other
    private String venue; // Clubhouse Hall, Main Lawn, Rooftop Terrace, Poolside Deck
    private String date;
    private String startTime;
    private String endTime;
    private int guests;
    private String notes;
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
    private String rejectionReason;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
