package com.societysync.entity;

public enum PaymentMethod {
    CASH,   // collected in person, marked paid by an admin
    ONLINE, // paid by the resident through the app (gateway integration point)
    NONE
}
