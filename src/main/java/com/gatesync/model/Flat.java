package com.gatesync.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Entity
@Table(name = "flats")
@Document(collection = "flats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.annotation.Id
    private Long id;

    @Column(nullable = false)
    private String block;

    @Column(nullable = false)
    private String flatNumber;

    private String ownerName;
    private String ownerPhone;

    @Builder.Default
    private boolean occupied = true;
}
