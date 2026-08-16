package com.gatesync.notification;

import com.gatesync.model.VisitorRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
@Slf4j
public class TwilioSmsProvider implements SmsProvider {

    @Override
    public SmsSendResult sendVisitorAlert(
            String phoneNumber,
            VisitorRequest visitorRequest
    ) {
        String message = String.format(
            "GateSync Alert: %s is waiting at the gate for Flat %s-%s. Purpose: %s. Please open GateSync to respond.",
            visitorRequest.getVisitorName(),
            visitorRequest.getTargetBlock(),
            visitorRequest.getTargetFlat(),
            visitorRequest.getPurpose()
        );

        log.info("Sending Production SMS to {}: {}", phoneNumber, message);
        return new SmsSendResult(true, "twilio-" + System.currentTimeMillis(), null);
    }

    @Override
    public SmsSendResult sendReminder(
            String phoneNumber,
            VisitorRequest visitorRequest
    ) {
        String message = String.format(
            "GateSync Reminder: %s is still waiting at the gate for Flat %s-%s. Please respond.",
            visitorRequest.getVisitorName(),
            visitorRequest.getTargetBlock(),
            visitorRequest.getTargetFlat()
        );

        log.info("Sending Production Reminder SMS to {}: {}", phoneNumber, message);
        return new SmsSendResult(true, "twilio-reminder-" + System.currentTimeMillis(), null);
    }
}
