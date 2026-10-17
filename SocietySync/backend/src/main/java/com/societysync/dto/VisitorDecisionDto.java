package com.societysync.dto;

public record VisitorDecisionDto(
    Long requestId,
    boolean approved
) {}
