package com.gatesync.notification;

import com.gatesync.model.VisitorRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "test", "default"})
@Slf4j
public class MockSmsProvider implements SmsProvider {

    @Override
    public SmsSendResult sendVisitorAlert(
            String phoneNumber,
            VisitorRequest visitorRequest
    ) {
        log.info(
            "MOCK SMS to {}: visitor {} is waiting for Flat {}-{}",
            mask(phoneNumber),
            visitorRequest.getVisitorName(),
            visitorRequest.getTargetBlock(),
            visitorRequest.getTargetFlat()
        );

        return new SmsSendResult(
            true,
            "mock-" + visitorRequest.getId(),
            null
        );
    }

    @Override
    public SmsSendResult sendReminder(
            String phoneNumber,
            VisitorRequest visitorRequest
    ) {
        log.info(
            "MOCK REMINDER SMS to {} for visitor request {}",
            mask(phoneNumber),
            visitorRequest.getId()
        );

        return new SmsSendResult(
            true,
            "mock-reminder-" + visitorRequest.getId(),
            null
        );
    }

    private String mask(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "******" + phone.substring(phone.length() - 4);
    }
}
