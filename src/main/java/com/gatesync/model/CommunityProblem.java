package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_problems")
@Document(collection = "community_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    @Builder.Default
    private String societyId = "SOC-101";

    private String reporterName;
    private String flat;

    public String getReporterFlat() {
        return flat;
    }
    private String title;
    private String category; // Water, Power, Security, Lift, Cleanliness, Noise, Other
    private String priority; // Low, Medium, High
    private String description;
    private String photoUrl;

    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, HIDDEN, RESOLVED

    private boolean pinned;
    private String adminReply;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
