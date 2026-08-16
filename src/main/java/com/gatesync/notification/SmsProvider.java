package com.gatesync.notification;

import com.gatesync.model.VisitorRequest;

public interface SmsProvider {

    SmsSendResult sendVisitorAlert(
            String phoneNumber,
            VisitorRequest visitorRequest
    );

    SmsSendResult sendReminder(
            String phoneNumber,
            VisitorRequest visitorRequest
    );
}
