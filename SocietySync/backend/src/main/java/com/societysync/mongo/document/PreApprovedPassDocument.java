package com.societysync.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "preapproved_passes")
@CompoundIndexes({
        @CompoundIndex(name = "idx_society_code", def = "{'societyId': 1, 'passCode': 1}"),
        @CompoundIndex(name = "idx_society_flat", def = "{'societyId': 1, 'flatNumber': 1, 'used': 1}")
})
@Getter
@Setter
@NoArgsConstructor
public class PreApprovedPassDocument {

    @Id
    private String id;

    @Indexed
    private String societyId;

    private String flatNumber;

    private Long residentUserId;

    private String residentLoginId;

    @Indexed(unique = true)
    private String passCode; // 6-digit OTP or unique code for QR

    private String visitorName;

    private String visitorPhone;

    private String vehicleNumber;

    private String category; // GUEST, SWIGGY, ZOMATO, AMAZON, CAB, COURIER, SERVICE

    private boolean leaveAtGate = false;

    private boolean used = false;

    private Instant usedAt;

    private String usedByGuardLoginId;

    private Instant validFrom = Instant.now();

    @Indexed(expireAfterSeconds = 0)
    private Instant validUntil;

    private Instant createdAt = Instant.now();
}
