package com.societysync.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Stand-in for the PHP app's Event Calendar / Neighbourhood modules, kept intentionally simple.
 * TODO: split into a real Event (with date/time) and NeighbourhoodPost (with comments) model
 * if you want those two modules back at full depth - this was out of scope for this pass.
 */
@Entity
@Table(name = "announcement")
@Getter
@Setter
@NoArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false)
    private String createdByLoginId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
