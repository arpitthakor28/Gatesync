package com.societysync.dto;

import java.math.BigDecimal;

public record BillCreateDto(
    String flatNumber,   // null => generate for ALL flats
    String billingMonth, // "2026-09"
    BigDecimal amount
) {}
