package com.gatesync.notification;

public record SmsSendResult(
        boolean accepted,
        String providerMessageId,
        String failureReason
) {
}
